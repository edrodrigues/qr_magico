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
      "X-Amz-Invocation-Type": "Event",
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

    if (presente.usuario_id !== user.id) {
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

    let musicaUrl: string | null = null;
    try {
      const { data: musica } = await supabase
        .from("musicas")
        .select("url_audio")
        .eq("presente_id", presenteId)
        .maybeSingle();
      musicaUrl = musica?.url_audio ?? null;
      console.log(`Music URL ${musicaUrl ? "found" : "not found"} for ${presenteId}`);
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

    const outDir = `renders/${presenteId}`;
    const bucketName = Deno.env.get("REMOTION_BUCKET_NAME") || "";

    const payload = {
      type: "start",
      composition: "Retrospectiva",
      inputProps,
      serveUrl,
      framesPerLambda: 30,
      outName: `${outDir}/out.mp4`,
      codec: "h264",
      videoBitrate: "8M",
      x264Preset: "medium",
    };

    const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).length;
    console.log(
      `Invoking Lambda for ${presenteId}: payload=${(payloadSize / 1024).toFixed(1)}KB, ${fotosUrls.length} photos`,
    );

    const response = await invokeLambda(
      awsRegion,
      functionName,
      payload,
      awsAccessKeyId,
      awsSecretAccessKey,
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Lambda invocation failed for ${presenteId}: ${response.status} ${errText}`);
      return new Response(JSON.stringify({ error: "Lambda invocation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const lambdaRequestId = response.headers.get("x-amzn-RequestId") || "";
    console.log(`Lambda invoked successfully for ${presenteId}: requestId=${lambdaRequestId}`);

    const { error: updateErr } = await supabase
      .from("presentes")
      .update({
        render_request_id: lambdaRequestId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", presenteId);

    if (updateErr) {
      console.error(`Failed to update presente ${presenteId} after Lambda invocation:`, updateErr);
    } else {
      console.log(`Presente ${presenteId} updated: render_request_id set, status remains generating`);
    }

    return new Response(JSON.stringify({ success: true, presenteId, requestId: lambdaRequestId }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error(`render-video error ${presenteId}:`, err);
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
