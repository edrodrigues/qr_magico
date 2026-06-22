import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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
      .select("usuario_id, video_url, status")
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

    const region = Deno.env.get("AWS_REGION") || "us-east-1";
    const bucket = Deno.env.get("REMOTION_BUCKET_NAME") || "";
    const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
    const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return new Response(JSON.stringify({ error: "S3 not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const key = `renders/${presenteId}/out.mp4`;

    if (presente.video_url) {
      const downloadUrl = await generatePresignedGetUrl(
        bucket, key, region, accessKeyId, secretAccessKey, 3600,
      );
      return new Response(JSON.stringify({
        status: "ready",
        presente_id: presenteId,
        download_url: downloadUrl,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // HEAD request anônimo falha para buckets S3 privados (sempre retorna 403).
    // Usamos uma GET presigned + Range: 0-0 para verificar existência do arquivo.
    const checkUrl = await generatePresignedGetUrl(
      bucket, key, region, accessKeyId, secretAccessKey, 60,
    );
    const checkResp = await fetch(checkUrl, {
      method: "GET",
      headers: { "Range": "bytes=0-0" },
    });

    if (checkResp.status !== 206 && checkResp.status !== 200) {
      if (presente.status === "ready") {
        await supabase
          .from("presentes")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", presenteId)
          .catch(() => {});
      }

      return new Response(JSON.stringify({
        error: "Video not yet rendered",
        status: "pending",
        presente_id: presenteId,
      }), {
        status: 202,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const proxyUrl = `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presenteId}`;
    const { error: updateErr } = await supabase
      .from("presentes")
      .update({
        video_url: proxyUrl,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", presenteId);

    if (updateErr) {
      console.error(`Failed to update presente ${presenteId}:`, updateErr);
    }

    const downloadUrl = await generatePresignedGetUrl(
      bucket, key, region, accessKeyId, secretAccessKey, 3600,
    );

    return new Response(JSON.stringify({
      status: "ready",
      presente_id: presenteId,
      download_url: downloadUrl,
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    const errorDetails = {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      env: {
        hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
        hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        hasBucket: !!Deno.env.get("REMOTION_BUCKET_NAME"),
        hasAwsKey: !!Deno.env.get("AWS_ACCESS_KEY_ID"),
        hasAwsSecret: !!Deno.env.get("AWS_SECRET_ACCESS_KEY"),
        region: Deno.env.get("AWS_REGION") || "us-east-1",
      },
    };
    console.error("get-download-url error:", JSON.stringify(errorDetails));
    return new Response(JSON.stringify({ error: errorDetails.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
