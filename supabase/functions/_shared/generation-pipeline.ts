import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export async function runGenerationPipeline(
  supabaseUrl: string,
  serviceKey: string,
  presenteId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const edgeHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
  };
  const body = JSON.stringify({ presente_id: presenteId });

  try {
    const musicRes = await fetch(`${supabaseUrl}/functions/v1/generate-music`, {
      method: "POST",
      headers: edgeHeaders,
      body,
    });

    if (!musicRes.ok) {
      const errText = await musicRes.text();
      console.error(`generate-music returned ${musicRes.status}: ${errText}`);
      const { data: music } = await supabase
        .from("musicas")
        .select("status, attempts")
        .eq("presente_id", presenteId)
        .maybeSingle();
      if (music?.status === "failed" || (music?.attempts ?? 0) >= 3) {
        await supabase.from("presentes").update({
          status: "failed",
          error_message: "Geração de música falhou",
          updated_at: new Date().toISOString(),
        }).eq("id", presenteId);
      }
      return;
    }

    const musicData = await musicRes.json().catch(() => ({}));
    if (!musicData.success) return;

    const videoRes = await fetch(`${supabaseUrl}/functions/v1/render-video`, {
      method: "POST",
      headers: edgeHeaders,
      body,
    });

    if (!videoRes.ok) {
      const errText = await videoRes.text();
      console.error(`render-video returned ${videoRes.status}: ${errText}`);
      if (videoRes.status === 409) return;
      await supabase.from("presentes").update({
        status: "failed",
        error_message: "Renderização de vídeo falhou",
        updated_at: new Date().toISOString(),
      }).eq("id", presenteId);
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Erro desconhecido na geração";
    console.error("generation pipeline error:", errMsg);
    await supabase.from("presentes").update({
      status: "failed",
      error_message: errMsg,
      updated_at: new Date().toISOString(),
    }).eq("id", presenteId).catch((e2) => {
      console.error("failed to mark presente as failed:", e2);
    });
  }
}

export function buildPresenteLink(slug: string): string {
  const appUrl = (Deno.env.get("APP_URL") || "https://www.momentomagico.xyz").replace(/\/$/, "");
  return `${appUrl}/p/${slug}`;
}
