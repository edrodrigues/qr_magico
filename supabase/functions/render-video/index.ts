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

async function invokeLambdaWithRetry(
  region: string,
  functionName: string,
  payload: Record<string, unknown>,
  accessKeyId: string,
  secretAccessKey: string,
  retries = 3,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await invokeLambda(region, functionName, payload, accessKeyId, secretAccessKey);
      if (response.ok || attempt === retries) return response;
      const errText = await response.text();
      lastError = new Error(`Lambda invocation failed: ${response.status} ${errText}`);
      console.warn(`Lambda retry ${attempt}/${retries} for ${functionName}: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === retries) throw lastError;
      console.warn(`Lambda retry ${attempt}/${retries} error:`, lastError.message);
    }
    await new Promise((r) => setTimeout(r, Math.pow(3, attempt - 1) * 1000));
  }
  throw lastError || new Error("Lambda invocation failed after retries");
}

function serializeInputProps(data: Record<string, unknown>): string {
  return JSON.stringify(data, (_, value) => {
    if (typeof value === "object" && value !== null && value instanceof Date) {
      return { __remotion_date: value.toISOString() };
    }
    return value;
  });
}

async function invokeLambda(
  region: string,
  functionName: string,
  payload: Record<string, unknown>,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<Response> {
  const host = `lambda.${region}.amazonaws.com`;
  const path = `/2015-03-31/functions/${functionName}/invocations`;
  const body = JSON.stringify(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const algorithm = "AWS4-HMAC-SHA256";
  const service = "lambda";

  const bodyHash = await sha256(body);

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:Invoke\n`;
  const signedHeaders = "host;x-amz-date;x-amz-target";

  const canonicalRequest =
    `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  const authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      "X-Amz-Target": "Invoke",
      "Authorization": authorizationHeader,
      "X-Amz-Invocation-Type": "RequestResponse",
    },
    body,
  });
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
  const apiKeyHeader = req.headers.get("apikey");
  const token = authHeader?.replace("Bearer ", "") || apiKeyHeader || "";
  
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isServiceRole = serviceRoleKey && token === serviceRoleKey;
  let user: { id: string } | null = null;
  
  if (!isServiceRole && token) {
    const { data: { user: u }, error: userErr } = await supabase.auth.getUser(token);
    if (!userErr && u) {
      user = u;
    }
  }
  // Allow all requests for testing (auth handled by Supabase verify_jwt=false)

  let presenteId: string | undefined;

  try {
    const body = await req.json();
    presenteId = body.presente_id;
    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: presente, error: presenteErr } = await supabase
      .from("presentes")
      .select("*")
      .eq("id", presenteId)
      .single();

    if (presenteErr || !presente) {
      return new Response(JSON.stringify({ error: "Presente not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (user && presente.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: fotos, error: fotosErr } = await supabase
      .from("fotos")
      .select("url, ordem")
      .eq("presente_id", presenteId)
      .order("ordem", { ascending: true });

    if (fotosErr) {
      console.error(`Failed to fetch fotos for ${presenteId}:`, fotosErr);
    }

    const fotosUrls = (fotos || []).map((f: { url: string }) => f.url);
    console.log(
      `Fetched ${fotosUrls.length} photos for ${presenteId}:`,
      fotosUrls.length > 0
        ? fotosUrls.map((u: string) => u.substring(u.lastIndexOf("/") + 1))
        : "none",
    );

    const MUSIC_POLL_INTERVAL_MS = parseInt(Deno.env.get("MUSIC_POLL_INTERVAL_MS") || "1000", 10);
    const MUSIC_POLL_MAX_ATTEMPTS = parseInt(Deno.env.get("MUSIC_POLL_MAX_ATTEMPTS") || "10", 10);

    let musicaUrl: string | null = null;
    try {
      for (let i = 0; i < MUSIC_POLL_MAX_ATTEMPTS; i++) {
        const { data: musica } = await supabase
          .from("musicas")
          .select("url_audio")
          .eq("presente_id", presenteId)
          .maybeSingle();
        musicaUrl = musica?.url_audio ?? null;
        if (musicaUrl) break;
        console.log(`Waiting for music URL (attempt ${i + 1}/20) for ${presenteId}`);
        await new Promise((r) => setTimeout(r, MUSIC_POLL_INTERVAL_MS));
      }
      console.log(`Music URL ${musicaUrl ? "found" : "not found after 60s"} for ${presenteId}`);
    } catch (e) {
      console.warn("Failed to fetch music, rendering without audio:", e);
    }

    const awsRegion = Deno.env.get("AWS_REGION") || "us-east-1";
    const functionName = Deno.env.get("REMOTION_FUNCTION_NAME") || "";
    const serveUrl = Deno.env.get("REMOTION_SERVE_URL") || "";
    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

    if (!functionName || !serveUrl) {
      return new Response(JSON.stringify({ error: "Remotion Lambda not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const framesPerLambda = parseInt(Deno.env.get("FRAMES_PER_LAMBDA") || "200", 10);

    const inputProps = {
      nome_homenageado: presente.nome_homenageado,
      nome_remetente: presente.nome_remetente,
      ocasiao: presente.ocasiao,
      data_inicio: presente.data_inicio,
      descricao_relacao: presente.descricao_relacao,
      estilo_musical: presente.estilo_musical,
      fotos: fotosUrls,
      thumbnail_url: presente.thumbnail_url || "",
      musicaUrl,
    };

    const webhookUrl = `${supabaseUrl}/functions/v1/render-complete`;
    const webhookSecret = Deno.env.get("RENDER_WEBHOOK_SECRET") || "";

    const serializedProps = serializeInputProps(inputProps);

    const payload = {
      type: "start",
      version: "4.0.482",
      rendererFunctionName: null,
      framesPerLambda: 200,
      composition: "Retrospectiva",
      serveUrl,
      inputProps: { type: "payload", payload: serializedProps },
      codec: "h264",
      imageFormat: "jpeg",
      crf: null,
      envVariables: {},
      pixelFormat: null,
      proResProfile: null,
      x264Preset: "medium",
      gopSize: null,
      jpegQuality: 80,
      maxRetries: 3,
      privacy: "public",
      logLevel: "info",
      frameRange: null,
      outName: `out.mp4`,
      timeoutInMilliseconds: 300000,
      chromiumOptions: {},
      scale: 1,
      everyNthFrame: 1,
      numberOfGifLoops: null,
      downloadBehavior: { type: "download" },
      muted: false,
      overwrite: true,
      audioBitrate: null,
      videoBitrate: "8M",
      encodingBufferSize: null,
      encodingMaxRate: null,
      webhook: {
        url: webhookUrl,
        secret: webhookSecret || undefined,
        customData: { presente_id: presenteId },
      },
      forceHeight: null,
      forceWidth: null,
      forceFps: null,
      forceDurationInFrames: null,
      bucketName: null,
      audioCodec: null,
      offthreadVideoCacheSizeInBytes: null,
      deleteAfter: null,
      colorSpace: null,
      preferLossless: false,
      forcePathStyle: false,
      metadata: null,
      licenseKey: null,
      offthreadVideoThreads: null,
      mediaCacheSizeInBytes: null,
      storageClass: null,
      isProduction: null,
      sampleRate: 48000,
    };

    const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).length;
    console.log(
      `Invoking Lambda for ${presenteId}: payload=${(payloadSize / 1024).toFixed(1)}KB, ${fotosUrls.length} photos`,
    );

    const response = await invokeLambdaWithRetry(
      awsRegion,
      functionName,
      payload,
      awsAccessKeyId,
      awsSecretAccessKey,
    );

    const bodyText = await response.text();
    let lambdaResponse: Record<string, unknown>;
    try {
      lambdaResponse = JSON.parse(bodyText);
    } catch {
      lambdaResponse = {};
    }

    if (!response.ok || response.headers.get("x-amz-function-error")) {
      const errMsg = (lambdaResponse?.errorMessage as string) || bodyText;
      console.error(`Lambda invocation failed for ${presenteId}: ${errMsg}`);
      await supabase
        .from("presentes")
        .update({ status: "failed", error_message: errMsg, updated_at: new Date().toISOString() })
        .eq("id", presenteId);
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const renderId = (lambdaResponse?.renderId as string) || "";
    const resultBucket = (lambdaResponse?.bucketName as string) || "";
    console.log(`Lambda start handler succeeded for ${presenteId}: renderId=${renderId}, bucket=${resultBucket}`);

    const { error: updateErr } = await supabase
      .from("presentes")
      .update({
        render_request_id: renderId,
        status: "generating",
        updated_at: new Date().toISOString(),
      })
      .eq("id", presenteId);

    if (updateErr) {
      console.error(`Failed to update presente ${presenteId}:`, updateErr);
    }

    return new Response(JSON.stringify({ success: true, presenteId, renderId }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`render-video error ${presenteId}:`, errMsg);
    if (presenteId) {
      await supabase
        .from("presentes")
        .update({ status: "failed", error_message: errMsg, updated_at: new Date().toISOString() })
        .eq("id", presenteId).catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
