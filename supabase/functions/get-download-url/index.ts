import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { buildPresenteLink } from "../_shared/generation-pipeline.ts";
import { fetchReadyMusicUrl, ensureVideoMuxed } from "../_shared/mux-video-audio.ts";
import { summarizeMuxError } from "../_shared/mux-lambda.ts";
import {
  buildFatalErrorLogDetail,
  elapsedMs,
  type RenderDiagnostics,
} from "../_shared/render-diagnostics.ts";
import {
  resolvePresenteVideoKey,
  type AwsRenderConfig,
} from "../_shared/resolve-presente-video.ts";
import {
  generatePresignedGetUrl,
  getAwsS3Config,
} from "../_shared/s3-presign.ts";
import { needsProxyNormalization, persistProxyVideoUrl } from "../_shared/video-url.ts";

function getAwsConfig(): AwsRenderConfig {
  return {
    ...getAwsS3Config(),
    functionName: Deno.env.get("REMOTION_FUNCTION_NAME") || "",
  };
}

function logDiagnostics(presenteId: string, debug: RenderDiagnostics): void {
  const pct = debug.overall_progress !== null
    ? `${Math.round(debug.overall_progress * 100)}%`
    : "n/a";
  console.log(
    `get-download-url: ${presenteId} render=${debug.render_id ?? "none"} verdict=${debug.verdict} progress=${pct} elapsed=${debug.elapsed_seconds}s`,
  );
  if (debug.fatal_error) {
    console.warn(
      `get-download-url: ${presenteId} fatal=${debug.remotion_error ?? "unknown"}`,
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();
    const presenteId = body.presente_id;
    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: presente, error: presenteErr } = await supabase
      .from("presentes")
      .select("usuario_id, video_url, status, render_request_id, slug, generation_started_at, video_muxed_at, error_message")
      .eq("id", presenteId)
      .single();

    if (presenteErr || !presente) {
      return new Response(JSON.stringify({ error: "Presente not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (presente.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const aws = getAwsConfig();
    if (!aws.bucket || !aws.accessKeyId || !aws.secretAccessKey) {
      return new Response(JSON.stringify({ error: "S3 not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const resolved = await resolvePresenteVideoKey(
      { ...presente, id: presenteId },
      aws,
    );
    logDiagnostics(presenteId, resolved.debug);

    if (resolved.kind === "failed") {
      console.error(
        `get-download-url: ${presenteId} confirmed fatal — ${buildFatalErrorLogDetail(resolved.debug, elapsedMs(presente.generation_started_at))}`,
      );

      if (presente.status === "generating") {
        await supabase
          .from("presentes")
          .update({
            status: "failed",
            error_message: resolved.errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", presenteId);
      } else if (presente.status === "ready") {
        await supabase
          .from("presentes")
          .update({
            status: "failed",
            video_url: null,
            error_message: resolved.errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", presenteId);
      }

      return new Response(JSON.stringify({
        status: "failed",
        presente_id: presenteId,
        error_message: resolved.errorMessage,
        debug: resolved.debug,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (resolved.kind === "pending") {
      return new Response(JSON.stringify({
        error: "Video not yet rendered",
        status: "pending",
        presente_id: presenteId,
        debug: resolved.debug,
      }), {
        status: 202,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const renderId = presente.render_request_id;
    const musicaUrl = renderId ? await fetchReadyMusicUrl(supabase, presenteId) : null;

    const mux = await ensureVideoMuxed(supabase, presenteId, {
      renderId,
      musicaUrl,
      bucket: aws.bucket,
      videoKey: resolved.key,
      videoMuxedAt: presente.video_muxed_at,
    });

    if (!mux.ok) {
      const errorMessage = summarizeMuxError(mux.error);
      return new Response(JSON.stringify({
        status: "pending",
        presente_id: presenteId,
        error_message: errorMessage,
        debug: { ...resolved.debug, verdict: "muxing", mux_error: mux.error },
      }), {
        status: 202,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const link = presente.slug ? buildPresenteLink(presente.slug) : null;

    if (needsProxyNormalization(presente.video_url) || presente.status !== "ready") {
      await persistProxyVideoUrl(supabase, presenteId, supabaseUrl, {
        status: "ready",
        ...(link ? { link } : {}),
      });
    }

    const downloadUrl = await generatePresignedGetUrl(aws, resolved.key, 3600, {
      attachment: true,
    });

    return new Response(JSON.stringify({
      status: "ready",
      presente_id: presenteId,
      download_url: downloadUrl,
      debug: resolved.debug,
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("get-download-url error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
