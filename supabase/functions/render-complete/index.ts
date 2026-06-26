import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { buildPresenteLink } from "../_shared/generation-pipeline.ts";
import { muxRenderWithMusic } from "../_shared/mux-video-audio.ts";
import { summarizeMuxError } from "../_shared/mux-lambda.ts";

async function hexSign(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractErrorMessage(body: Record<string, unknown>): string {
  if (Array.isArray(body.errors)) {
    return body.errors
      .map((e: unknown) =>
        typeof e === "string" ? e : (e as { message?: string })?.message || JSON.stringify(e)
      )
      .join("; ");
  }
  if (typeof body.message === "string") return body.message;
  return `Webhook status: ${body.type || "unknown"}`;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, X-Remotion-Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("RENDER_WEBHOOK_SECRET");
  if (webhookSecret) {
    const signature = req.headers.get("X-Remotion-Signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing X-Remotion-Signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    const rawBody = await req.clone().text();
    const expected = await hexSign(webhookSecret, rawBody);
    if (signature !== expected) {
      console.warn(`render-complete: invalid signature. Got ${signature.slice(0, 16)}..., expected ${expected.slice(0, 16)}...`);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const presenteId = body.customData?.presente_id || body.presente_id;
    const renderStatus = body.type || body.status;
    const videoUrl = body.outputUrl || body.output?.url || body.video_url || null;
    const outputFile = body.outputFile || body.outKey || null;
    const renderId = String(body.renderId || "");
    const muxAudio = Boolean(body.customData?.mux_audio);
    const musicaUrl = typeof body.customData?.musica_url === "string"
      ? body.customData.musica_url
      : null;
    const bucket = Deno.env.get("REMOTION_BUCKET_NAME") || "";

    console.log(
      `render-complete: ${presenteId} type=${renderStatus} outputFile=${outputFile || "none"} mux=${muxAudio}`,
    );

    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (renderStatus === "success" || renderStatus === "completed" || renderStatus === "done") {
      const { data: presente } = await supabase
        .from("presentes")
        .select("render_request_id, slug")
        .eq("id", presenteId)
        .single();

      if (presente?.render_request_id && renderId) {
        if (presente.render_request_id !== renderId) {
          console.warn(
            `render-complete: renderId mismatch for ${presenteId}. Expected ${presente.render_request_id}, got ${renderId}`,
          );
        }
      }

      if (muxAudio && musicaUrl && renderId && bucket) {
        const mux = await muxRenderWithMusic({ renderId, musicaUrl, bucket });
        if (!mux.ok) {
          const userMessage = summarizeMuxError(mux.error);
          await supabase
            .from("presentes")
            .update({
              status: "failed",
              error_message: userMessage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", presenteId);
          console.error(`render-complete: ${presenteId} mux failed — ${mux.error}`);
          return new Response(JSON.stringify({ success: false, error: mux.error }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }
        console.log(`render-complete: ${presenteId} mux OK`);
      }

      const proxyUrl = `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presenteId}`;
      const link = presente?.slug ? buildPresenteLink(presente.slug) : null;
      await supabase
        .from("presentes")
        .update({
          video_url: videoUrl || proxyUrl,
          status: "ready",
          ...(link ? { link } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId);
      console.log(`render-complete: ${presenteId} → ready`);
    } else if (renderStatus === "error" || renderStatus === "timeout") {
      const errorMsg = extractErrorMessage(body);
      await supabase
        .from("presentes")
        .update({
          status: "failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId);
      console.log(`render-complete: ${presenteId} → failed (${errorMsg})`);
    } else {
      console.warn(`render-complete: ${presenteId} unhandled type=${renderStatus}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("render-complete error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
