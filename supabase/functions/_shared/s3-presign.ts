const crypto = globalThis.crypto;

export interface AwsS3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface PresignOptions {
  attachment?: boolean;
}

export function getAwsS3Config(): AwsS3Config {
  return {
    region: Deno.env.get("AWS_REGION") || "us-east-1",
    bucket: Deno.env.get("REMOTION_BUCKET_NAME") || "",
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  };
}

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

export async function generatePresignedGetUrl(
  config: AwsS3Config,
  key: string,
  expiresInSeconds: number,
  options: PresignOptions = {},
): Promise<string> {
  const { region, bucket, accessKeyId, secretAccessKey } = config;
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

  if (options.attachment) {
    params["response-content-disposition"] = "attachment";
  }

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

export async function checkS3ObjectExists(
  config: AwsS3Config,
  key: string,
): Promise<boolean> {
  const checkUrl = await generatePresignedGetUrl(config, key, 60);
  const checkResp = await fetch(checkUrl, {
    method: "GET",
    headers: { Range: "bytes=0-0" },
  });
  return checkResp.status === 206 || checkResp.status === 200;
}
