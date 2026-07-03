import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { fetchReadyMusicUrl, ensureVideoMuxed } from "../_shared/mux-video-audio.ts";
import { summarizeMuxError } from "../_shared/mux-lambda.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const url = new URL(req.url);
  const presenteId = url.searchParams.get("presente_id");
  const slug = url.searchParams.get("slug");

  if (!presenteId && !slug) {
    return new Response(JSON.stringify({ error: "Missing presente_id or slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const query = supabase
      .from("presentes")
      .select("id, video_url, status, render_request_id, video_muxed_at, generation_started_at");

    if (presenteId) {
      query.eq("id", presenteId);
    } else {
      query.eq("slug", slug);
    }

    const { data: presente, error: presenteErr } = await query.single();

    if (presenteErr || !presente) {
      return new Response(JSON.stringify({ error: "Presente not found" }), {
        status: 404,
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

    const resolved = await resolvePresenteVideoKey(presente, aws);

    if (resolved.kind !== "key") {
      return new Response(JSON.stringify({ error: "Video not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const key = resolved.key;

    if (needsProxyNormalization(presente.video_url)) {
      await persistProxyVideoUrl(supabase, presente.id, supabaseUrl, {
        status: "ready",
      });
    }

    const musicaUrl = presente.render_request_id
      ? await fetchReadyMusicUrl(supabase, presente.id)
      : null;

    const mux = await ensureVideoMuxed(supabase, presente.id, {
      renderId: presente.render_request_id,
      musicaUrl,
      bucket: aws.bucket,
      videoKey: key,
      videoMuxedAt: presente.video_muxed_at,
    });

    if (!mux.ok) {
      return new Response(JSON.stringify({ error: summarizeMuxError(mux.error) }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const presignedUrl = await generatePresignedGetUrl(aws, key, 3600);

    const isJson = url.searchParams.has("format") && url.searchParams.get("format") === "json";
    if (isJson) {
      return new Response(JSON.stringify({
        url: presignedUrl,
        expires_in: 3600,
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "*",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        "Location": presignedUrl,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("proxy-video error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
