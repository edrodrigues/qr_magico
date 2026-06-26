import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

import { buildPresenteLink } from "../_shared/generation-pipeline.ts";

import {
  buildLegacyOutputKey,
  buildRenderOutputKeys,
  findExistingRenderKey,
} from "../_shared/remotion-s3.ts";

import { fetchReadyMusicUrl, muxRenderWithMusic } from "../_shared/mux-video-audio.ts";
import { summarizeMuxError } from "../_shared/mux-lambda.ts";

import {
  buildFatalErrorLogDetail,
  buildFatalErrorMessage,
  buildRenderDiagnostics,
  elapsedMs,
  isConfirmedFatalFailure,
  PROGRESS_GRACE_MS,
  type RenderDiagnostics,
} from "../_shared/render-diagnostics.ts";

import {
  extractProgressOutKey,
  extractProgressErrorMessage,
  extractS3KeyFromUrl,
  getRenderProgress,
  isProxyVideoUrl,
  type RenderProgressResult,
} from "../_shared/remotion-lambda.ts";

const crypto = globalThis.crypto;

function sha256(data: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)).then(
    (h) => Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  return crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)))
    .then((s) => new Uint8Array(s));
}

async function hmacHex(key: Uint8Array, data: string): Promise<string> {
  const sig = await hmac(key, data);
  return Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<Uint8Array> {
  const kDate = await hmac(new TextEncoder().encode("AWS4" + key), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return await hmac(kService, "aws4_request");
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function generatePresignedGetUrl(
  bucket: string,
  key: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  expiresInSeconds: number,
): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const algorithm = "AWS4-HMAC-SHA256";
  const service = "s3";
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const credential = `${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`;
  const signedHeaders = "host";

  const params: Record<string, string> = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
    "response-content-disposition": "attachment",
  };

  const canonicalQueryString = Object.keys(params)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(params[k])}`)
    .join("&");

  const canonicalUri = "/" + key.split("/").map(encodeRfc3986).join("/");
  const canonicalRequest =
    `GET\n${canonicalUri}\n${canonicalQueryString}\nhost:${host}\n\n${signedHeaders}\nUNSIGNED-PAYLOAD`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

interface AwsConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  functionName: string;
}

interface PresenteRow {
  usuario_id: string;
  video_url: string | null;
  status: string;
  render_request_id: string | null;
  slug: string | null;
  generation_started_at: string | null;
}

type ResolveResult =
  | { kind: "key"; key: string; debug: RenderDiagnostics }
  | { kind: "pending"; debug: RenderDiagnostics }
  | { kind: "failed"; debug: RenderDiagnostics; errorMessage: string };

async function checkS3Exists(
  aws: AwsConfig,
  s3Key: string,
): Promise<boolean> {
  const checkUrl = await generatePresignedGetUrl(
    aws.bucket, s3Key, aws.region, aws.accessKeyId, aws.secretAccessKey, 60,
  );
  const checkResp = await fetch(checkUrl, {
    method: "GET",
    headers: { Range: "bytes=0-0" },
  });
  return checkResp.status === 206 || checkResp.status === 200;
}

async function fetchRenderProgress(
  renderId: string,
  aws: AwsConfig,
): Promise<RenderProgressResult | null> {
  return getRenderProgress(renderId, aws.bucket, {
    region: aws.region,
    functionName: aws.functionName,
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
  });
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

async function resolveVideoKey(
  presente: PresenteRow,
  presenteId: string,
  aws: AwsConfig,
): Promise<ResolveResult> {
  const elapsed = elapsedMs(presente.generation_started_at);
  const renderId = presente.render_request_id;
  const candidateKeys = renderId
    ? buildRenderOutputKeys(renderId, presenteId)
    : [buildLegacyOutputKey(presenteId)];

  if (presente.video_url && !isProxyVideoUrl(presente.video_url)) {
    const directKey = extractS3KeyFromUrl(presente.video_url);
    if (directKey) {
      const debug = buildRenderDiagnostics({
        renderId,
        progress: null,
        s3KeysChecked: [directKey],
        s3Found: true,
        elapsedMs: elapsed,
      });
      return { kind: "key", key: directKey, debug };
    }
  }

  let progress: RenderProgressResult | null = null;
  const pastGrace = elapsed >= PROGRESS_GRACE_MS;

  if (renderId && pastGrace) {
    progress = await fetchRenderProgress(renderId, aws);
    if (progress?.fatalErrorEncountered) {
      console.warn(
        `get-download-url: render ${renderId} fatal (poll): ${extractProgressErrorMessage(progress)}`,
      );
    }
    if (progress?.done) {
      const outKey = extractProgressOutKey(progress);
      if (outKey) {
        const debug = buildRenderDiagnostics({
          renderId,
          progress,
          s3KeysChecked: candidateKeys,
          s3Found: true,
          elapsedMs: elapsed,
        });
        return { kind: "key", key: outKey, debug };
      }
    }
  }

  const s3Key = await findExistingRenderKey(candidateKeys, (k) => checkS3Exists(aws, k));
  const debug = buildRenderDiagnostics({
    renderId,
    progress,
    s3KeysChecked: candidateKeys,
    s3Found: !!s3Key,
    elapsedMs: elapsed,
  });

  if (s3Key) {
    return { kind: "key", key: s3Key, debug };
  }

  if (isConfirmedFatalFailure(debug, elapsed)) {
    return {
      kind: "failed",
      debug,
      errorMessage: buildFatalErrorMessage(debug, elapsed),
    };
  }

  return { kind: "pending", debug };
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
      .select("usuario_id, video_url, status, render_request_id, slug, generation_started_at")
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

    const aws: AwsConfig = {
      region: Deno.env.get("AWS_REGION") || "us-east-1",
      bucket: Deno.env.get("REMOTION_BUCKET_NAME") || "",
      accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
      secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
      functionName: Deno.env.get("REMOTION_FUNCTION_NAME") || "",
    };

    if (!aws.bucket || !aws.accessKeyId || !aws.secretAccessKey) {
      return new Response(JSON.stringify({ error: "S3 not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const resolved = await resolveVideoKey(presente, presenteId, aws);
    logDiagnostics(presenteId, resolved.debug);

    if (resolved.kind === "failed") {
      console.error(
        `get-download-url: ${presenteId} confirmed fatal — ${buildFatalErrorLogDetail(resolved.debug, elapsedMs(presente.generation_started_at))}`,
      );

      await supabase
        .from("presentes")
        .update({
          status: "failed",
          error_message: resolved.errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId);

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

    if (musicaUrl && renderId) {
      const mux = await muxRenderWithMusic({
        renderId,
        musicaUrl,
        bucket: aws.bucket,
        videoKey: resolved.key,
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
    }

    const proxyUrl = `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presenteId}`;
    const link = presente.slug ? buildPresenteLink(presente.slug) : null;

    if (presente.status !== "ready" || !presente.video_url || isProxyVideoUrl(presente.video_url)) {
      const { error: updateErr } = await supabase
        .from("presentes")
        .update({
          video_url: proxyUrl,
          status: "ready",
          ...(link ? { link } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId);

      if (updateErr) {
        console.error(`Failed to update presente ${presenteId}:`, updateErr);
      }
    }

    const downloadUrl = await generatePresignedGetUrl(
      aws.bucket, resolved.key, aws.region, aws.accessKeyId, aws.secretAccessKey, 3600,
    );

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
