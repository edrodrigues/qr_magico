import { invokeLambda } from "./remotion-lambda.ts";

export interface MuxLambdaPayload {
  bucket: string;
  videoKey: string;
  audioUrl: string;
  outputKey?: string;
}

export interface MuxLambdaResult {
  success: boolean;
  outputKey?: string;
  error?: string;
}

export function summarizeMuxError(raw: string | undefined): string {
  if (!raw) return "Mux Lambda não configurada ou sem permissão IAM.";
  const lower = raw.toLowerCase();
  if (lower.includes("accessdenied") || lower.includes("not authorized")) {
    return "Mux Lambda sem permissão IAM (lambda:InvokeFunction). Veja infra/aws/MUX_LAMBDA_SETUP.md.";
  }
  if (lower.includes("resourcenotfound") || lower.includes("function not found")) {
    return "Mux Lambda não encontrada. O admin AWS deve criar qr-magico-mux-video-audio.";
  }
  if (lower.includes("mux_lambda_function_name not configured")) {
    return "MUX_LAMBDA_FUNCTION_NAME não configurado no Supabase.";
  }
  return raw;
}

export async function invokeMuxLambda(
  config: {
    region: string;
    functionName: string;
    accessKeyId: string;
    secretAccessKey: string;
  },
  payload: MuxLambdaPayload,
): Promise<MuxLambdaResult> {
  const response = await invokeLambda(
    config.region,
    config.functionName,
    payload,
    config.accessKeyId,
    config.secretAccessKey,
  );

  const bodyText = await response.text();
  let data: MuxLambdaResult & { errorMessage?: string };
  try {
    data = JSON.parse(bodyText);
  } catch {
    return { success: false, error: `Invalid mux Lambda response: ${bodyText.slice(0, 200)}` };
  }

  if (!response.ok || response.headers.get("x-amz-function-error")) {
    const errMsg = typeof data.errorMessage === "string"
      ? data.errorMessage
      : bodyText;
    return { success: false, error: errMsg };
  }

  if (data.success) return data;

  return {
    success: false,
    error: data.error || "Mux Lambda failed",
  };
}
