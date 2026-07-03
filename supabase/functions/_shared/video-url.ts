import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { isProxyVideoUrl } from "./remotion-lambda.ts";

export function buildProxyVideoUrl(supabaseUrl: string, presenteId: string): string {
  return `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presenteId}`;
}

export function needsProxyNormalization(videoUrl: string | null | undefined): boolean {
  return !videoUrl || !isProxyVideoUrl(videoUrl);
}

export async function persistProxyVideoUrl(
  supabase: SupabaseClient,
  presenteId: string,
  supabaseUrl: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("presentes")
    .update({
      video_url: buildProxyVideoUrl(supabaseUrl, presenteId),
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", presenteId);

  if (error) {
    console.error(`persistProxyVideoUrl: failed for ${presenteId}:`, error);
  }
}
