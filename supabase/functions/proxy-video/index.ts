import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
<<<<<<< HEAD
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  buildLegacyOutputKey,
  buildRenderOutputKeys,
  findExistingRenderKey,
} from "../_shared/remotion-s3.ts";
import { fetchReadyMusicUrl, muxRenderWithMusic } from "../_shared/mux-video-audio.ts";
=======
import { fetchReadyMusicUrl, ensureVideoMuxed } from "../_shared/mux-video-audio.ts";
>>>>>>> 1eafcc67f350566a068a81e209045f59f4a4bfa7
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
  const corsHeaders = getCorsHeaders(req.headers.get("origin"))
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
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
      headers: { "Content-Type": "application/json", ...corsHeaders },
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (presenteId && !slug) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const { data: { user }, error: userErr } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (userErr || !user || presente.usuario_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (slug && presente.status !== "ready") {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const aws = getAwsConfig();
    if (!aws.bucket || !aws.accessKeyId || !aws.secretAccessKey) {
      return new Response(JSON.stringify({ error: "S3 not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resolved = await resolvePresenteVideoKey(presente, aws);

<<<<<<< HEAD
    const checkS3Exists = async (s3Key: string): Promise<boolean> => {
      const checkUrl = await generatePresignedGetUrl(
        bucket, s3Key, region, accessKeyId, secretAccessKey, 60,
      );
      const checkResp = await fetch(checkUrl, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
      });
      return checkResp.status === 206 || checkResp.status === 200;
    };

    const key = await findExistingRenderKey(candidateKeys, checkS3Exists);

    if (!presente.video_url) {
      if (!key) {
        return new Response(JSON.stringify({ error: "Video not available" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const proxyUrl = `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presente.id}`;
      await supabase
        .from("presentes")
        .update({
          video_url: proxyUrl,
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", presente.id);
    }

    if (!key) {
=======
    if (resolved.kind !== "key") {
>>>>>>> 1eafcc67f350566a068a81e209045f59f4a4bfa7
      return new Response(JSON.stringify({ error: "Video not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
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
<<<<<<< HEAD
      if (!mux.ok) {
        return new Response(JSON.stringify({ error: summarizeMuxError(mux.error) }), {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
=======
>>>>>>> 1eafcc67f350566a068a81e209045f59f4a4bfa7
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
          ...corsHeaders,
          "Access-Control-Expose-Headers": "*",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        "Location": presignedUrl,
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("proxy-video error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
