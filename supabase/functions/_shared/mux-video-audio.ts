import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { invokeMuxLambda, summarizeMuxError } from "./mux-lambda.ts";
import { RENDER_OUTPUT_NAME } from "./remotion-s3.ts";

export function buildCanonicalRenderVideoKey(renderId: string): string {
  return `renders/${renderId}/${RENDER_OUTPUT_NAME}`;
}

export async function muxRenderWithMusic(input: {
  renderId: string;
  musicaUrl: string;
  bucket: string;
  videoKey?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const functionName = Deno.env.get("MUX_LAMBDA_FUNCTION_NAME") || "";
  const region = Deno.env.get("AWS_REGION") || "us-east-1";
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

  if (!functionName) {
    return { ok: false, error: summarizeMuxError("MUX_LAMBDA_FUNCTION_NAME not configured") };
  }

  const videoKey = input.videoKey ?? buildCanonicalRenderVideoKey(input.renderId);
  const result = await invokeMuxLambda(
    { region, functionName, accessKeyId, secretAccessKey },
    {
      bucket: input.bucket,
      videoKey,
      audioUrl: input.musicaUrl,
      outputKey: videoKey,
    },
  );

  if (!result.success) {
    return { ok: false, error: summarizeMuxError(result.error || "Mux failed") };
  }

  return { ok: true };
}

export async function fetchReadyMusicUrl(
  supabase: SupabaseClient,
  presenteId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("musicas")
    .select("url_audio, status")
    .eq("presente_id", presenteId)
    .maybeSingle();

  if (data?.status === "ready" && data.url_audio) return data.url_audio;
  return null;
}
