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

  const params: Record<string, string> = {
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalQueryString = Object.keys(params)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(params[k])}`)
    .join("&");

  const canonicalUri = "/" + key.split("/").map(encodeRfc3986).join("/");

  const canonicalRequest =
    `GET\n${canonicalUri}\n${canonicalQueryString}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;

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
      .select("id, video_url, status");

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

    const key = `renders/${presente.id}/out.mp4`;

    if (!presente.video_url) {
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
        return new Response(JSON.stringify({ error: "Video not available" }), {
          status: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if (!presente.video_url) {
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
    const presignedUrl = await generatePresignedGetUrl(
      bucket, key, region, accessKeyId, secretAccessKey, 3600,
    );

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
