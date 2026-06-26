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

export async function invokeLambda(
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

export interface RenderProgressResult {
  done: boolean;
  fatalErrorEncountered: boolean;
  outKey: string | null;
  outputFile: string | null;
  overallProgress: number | null;
  chunks: number | null;
  timeToFinish: number | null;
  errors?: Array<{ message?: string }>;
}

export async function getRenderProgress(
  renderId: string,
  bucketName: string,
  config: {
    region: string;
    functionName: string;
    accessKeyId: string;
    secretAccessKey: string;
    version?: string;
  },
): Promise<RenderProgressResult | null> {
  const payload = {
    type: "status",
    bucketName,
    renderId,
    version: config.version || Deno.env.get("REMOTION_VERSION") || "4.0.482",
    s3OutputProvider: null,
    logLevel: "info",
    forcePathStyle: false,
  };

  const response = await invokeLambda(
    config.region,
    config.functionName,
    payload,
    config.accessKeyId,
    config.secretAccessKey,
  );

  const bodyText = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(bodyText);
  } catch {
    console.warn(`getRenderProgress: invalid JSON for ${renderId}`);
    return null;
  }

  if (!response.ok || response.headers.get("x-amz-function-error")) {
    const errMsg = typeof data.errorMessage === "string" ? data.errorMessage : bodyText;
    console.warn(`getRenderProgress failed for ${renderId}: ${errMsg}`);
    return null;
  }

  const overallProgress = typeof data.overallProgress === "number"
    ? Math.min(1, Math.max(0, data.overallProgress))
    : null;

  return {
    done: Boolean(data.done),
    fatalErrorEncountered: Boolean(data.fatalErrorEncountered),
    outKey: typeof data.outKey === "string" ? data.outKey : null,
    outputFile: typeof data.outputFile === "string" ? data.outputFile : null,
    overallProgress,
    chunks: typeof data.chunks === "number" ? data.chunks : null,
    timeToFinish: typeof data.timeToFinish === "number" ? data.timeToFinish : null,
    errors: Array.isArray(data.errors)
      ? data.errors.map((e: unknown) => {
          if (typeof e === "string") return { message: e };
          if (e && typeof e === "object" && "message" in e) {
            return { message: String((e as { message: unknown }).message) };
          }
          return { message: JSON.stringify(e) };
        })
      : undefined,
  };
}

export function extractProgressOutKey(progress: RenderProgressResult): string | null {
  if (progress.outKey) return progress.outKey;
  if (progress.outputFile) return extractS3KeyFromUrl(progress.outputFile);
  return null;
}

export function extractProgressErrorMessage(progress: RenderProgressResult): string {
  return progress.errors?.[0]?.message || "Renderização do vídeo falhou.";
}

export function isProxyVideoUrl(videoUrl: string): boolean {
  return videoUrl.includes("/proxy-video");
}

export function extractS3KeyFromUrl(videoUrl: string): string | null {
  try {
    const parsed = new URL(videoUrl);
    if (parsed.hostname.includes(".s3.") || parsed.hostname.startsWith("s3.")) {
      const key = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
      return key || null;
    }
  } catch {
    return null;
  }
  return null;
}
