import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

import { logGeneration } from "./generationDebug";



export type StepStatus = "pending" | "active" | "done" | "failed";

export type GenerationPhase = "music" | "video" | "finalizing";

export type RestartPhase = "full" | "video_only";



export interface GenerationStep {

  id: string;

  label: string;

  status: StepStatus;

}



export interface PresenteGenerationRow {

  status: string;

  video_url?: string | null;

  render_request_id?: string | null;

  error_message?: string | null;

  created_at: string;

  musicas?: Array<{

    status?: string;

    url_audio?: string | null;

    attempts?: number;

    last_attempt_at?: string | null;

  }>;

}



export interface GiftRestartInfo {

  status: string;

  musicStatus?: string;

  musicUrl?: string;

  videoUrl?: string;

}



export const STUCK_GENERATION_MS = 20 * 60 * 1000;

export const GENERATION_FETCH_TIMEOUT_MS = 180_000;



const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;



function inferMusicStepStatus(

  musicStatus?: string,

  musicUrl?: string | null,

  hasRenderRequest = false,

  videoReady = false,

): StepStatus {

  if (musicStatus === "ready" || musicUrl) return "done";

  if (hasRenderRequest || videoReady) return "done";

  if (musicStatus === "failed") return "failed";

  if (musicStatus === "generating") return "active";

  return "pending";

}



function inferVideoStepStatus(

  musicDone: boolean,

  hasRenderRequest: boolean,

  videoReady: boolean,

): StepStatus {

  if (videoReady) return "done";

  if (hasRenderRequest) return "active";

  if (!musicDone) return "pending";

  return "active";

}



function inferLinkStepStatus(presenteStatus: string): StepStatus {

  return presenteStatus === "ready" ? "done" : "pending";

}



export function inferGenerationSteps(row: PresenteGenerationRow): GenerationStep[] {

  const musicRow = row.musicas?.[0];

  const musicStatus = musicRow?.status;

  const musicUrl = musicRow?.url_audio;

  const videoReady = !!row.video_url;

  const hasRenderRequest = !!row.render_request_id;

  const musicStepStatus = inferMusicStepStatus(musicStatus, musicUrl, hasRenderRequest, videoReady);

  const musicDone = musicStepStatus === "done";



  return [

    { id: "music", label: "Música personalizada", status: musicStepStatus },

    {

      id: "video",

      label: "Vídeo com fotos",

      status: inferVideoStepStatus(musicDone, hasRenderRequest, videoReady),

    },

    {

      id: "link",

      label: "Link exclusivo",

      status: inferLinkStepStatus(row.status),

    },

  ];

}



export function getGenerationPhase(steps: GenerationStep[]): GenerationPhase {

  const failed = steps.find((s) => s.status === "failed");

  if (failed?.id === "video") return "video";

  if (failed?.id === "music") return "music";



  const active = steps.find((s) => s.status === "active");

  if (active?.id === "video") return "video";

  if (active?.id === "music") return "music";



  const musicDone = steps.find((s) => s.id === "music")?.status === "done";

  const videoDone = steps.find((s) => s.id === "video")?.status === "done";

  if (musicDone && !videoDone) return "video";

  return "finalizing";

}



export function getStepMessage(steps: GenerationStep[], errorMessage?: string | null): string {

  const failed = steps.find((s) => s.status === "failed");

  if (failed?.id === "music") {

    return errorMessage || "Falha ao gerar a música. Tente novamente.";

  }

  if (failed?.id === "video") {

    return errorMessage || "Falha ao renderizar o vídeo. Tente novamente.";

  }



  const active = steps.find((s) => s.status === "active");

  if (!active) {

    const musicDone = steps.find((s) => s.id === "music")?.status === "done";

    const videoPending = steps.find((s) => s.id === "video")?.status !== "done";

    if (musicDone && videoPending) {

      return "Música pronta! Renderizando o vídeo com suas fotos...";

    }

    return "Finalizando seu presente...";

  }



  switch (active.id) {

    case "music":

      return "Criando sua música personalizada com inteligência artificial...";

    case "video":

      return "Música pronta! Renderizando o vídeo com suas fotos...";

    default:

      return "Preparando os últimos detalhes...";

  }

}



export function isGenerationStuck(

  status: string,

  createdAt: string,

  musicLastAttemptAt?: string | null,

  generationStartedAt?: string | null,

): boolean {

  if (status !== "generating") return false;

  const anchor = generationStartedAt || musicLastAttemptAt || createdAt;

  return Date.now() - new Date(anchor).getTime() > STUCK_GENERATION_MS;

}



export function shouldRunRecovery(gift: {

  status: string;

  isStuck?: boolean;

  generationStartedAt?: string;

}): boolean {

  return gift.status === "generating" && !!gift.isStuck && !!gift.generationStartedAt;

}



export function isMusicReady(gift: GiftRestartInfo): boolean {

  return gift.musicStatus === "ready" || !!gift.musicUrl;

}



export function resolveRestartPhase(gift: GiftRestartInfo): RestartPhase {
  return isMusicReady(gift) ? "video_only" : "full";
}

export async function resolveRestartPhaseFromDb(presenteId: string): Promise<RestartPhase> {
  const [{ data: music }, { data: presente }] = await Promise.all([
    supabase
      .from("musicas")
      .select("status, url_audio")
      .eq("presente_id", presenteId)
      .maybeSingle(),
    supabase
      .from("presentes")
      .select("error_message")
      .eq("id", presenteId)
      .maybeSingle(),
  ]);

  const errorMsg = (presente?.error_message ?? "").toLowerCase();
  const audioRenderFailed =
    errorMsg.includes("música inválid") ||
    errorMsg.includes("musica invalid");

  if (music?.status === "failed" || audioRenderFailed) {
    return "full";
  }

  const musicReady = music?.status === "ready" && !!music?.url_audio;
  return musicReady ? "video_only" : "full";
}



async function isMusicFailureFinal(presenteId: string): Promise<boolean> {

  const { data } = await supabase

    .from("musicas")

    .select("status, attempts")

    .eq("presente_id", presenteId)

    .maybeSingle();

  return data?.status === "failed" || (data?.attempts ?? 0) >= 3;

}



export async function prepareMusicRow(

  presenteId: string,

  estilo = "gerando",

): Promise<{ error: string | null }> {

  const { error } = await supabase.rpc("upsert_musica", {

    p_presente_id: presenteId,

    p_status: "generating",

    p_estilo: estilo,

    p_attempts: 0,

    p_last_attempt_at: null,

  });

  return { error: error?.message ?? null };

}



/** Promove presente com video_url mas status ainda não ready. */

export async function promoteOrphanVideo(

  presenteId: string,

): Promise<{ promoted: boolean; error: string | null }> {

  const { data, error } = await supabase

    .from("presentes")

    .select("video_url, status")

    .eq("id", presenteId)

    .single();



  if (error || !data?.video_url || data.status === "ready") {

    return { promoted: false, error: error?.message ?? null };

  }



  const { error: updateErr } = await supabase

    .from("presentes")

    .update({

      status: "ready",

      error_message: "",

      updated_at: new Date().toISOString(),

    })

    .eq("id", presenteId);



  return { promoted: true, error: updateErr?.message ?? null };

}



export async function restartGeneration(

  presenteId: string,

  phase: RestartPhase,

  options: { musicStyle?: string } = {},

): Promise<{ error: string | null; skipMusic: boolean }> {

  const orphan = await promoteOrphanVideo(presenteId);

  if (orphan.promoted) return { error: orphan.error, skipMusic: true };

  if (orphan.error) return { error: orphan.error, skipMusic: false };



  if (phase === "full") {

    const { error: prepErr } = await prepareMusicRow(

      presenteId,

      options.musicStyle ?? "gerando",

    );

    if (prepErr) return { error: prepErr, skipMusic: false };

  }



  const { error } = await supabase

    .from("presentes")

    .update({

      status: "generating",

      error_message: "",

      generation_started_at: new Date().toISOString(),

      render_request_id: null,

      video_url: null,

      updated_at: new Date().toISOString(),

    })

    .eq("id", presenteId);



  return { error: error?.message ?? null, skipMusic: phase === "video_only" };

}



/** @deprecated Use restartGeneration */

export async function markPresenteGenerating(presenteId: string): Promise<{ error: string | null }> {

  const { error } = await restartGeneration(presenteId, "full");

  return { error };

}



export interface TriggerGenerationOptions {

  skipMusic?: boolean;

  onError?: (message: string) => void;

}



export async function triggerGeneration(

  presenteId: string,

  session: Session | null,

  options: TriggerGenerationOptions = {},

): Promise<void> {

  if (!session?.access_token) {

    options.onError?.("Sessão expirada.");

    return;

  }



  const headers = {

    "Content-Type": "application/json",

    Authorization: `Bearer ${session.access_token}`,

  };

  const body = JSON.stringify({ presente_id: presenteId });

  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), GENERATION_FETCH_TIMEOUT_MS);



  try {

    if (!options.skipMusic) {

      logGeneration(presenteId, "music_start");

      const musicRes = await fetch(`${EDGE_URL}/generate-music`, {

        method: "POST",

        headers,

        body,

        signal: controller.signal,

      });



      if (!musicRes.ok) {

        const errBody = await musicRes.text();

        console.error("generate-music error:", { status: musicRes.status, body: errBody });

        if (await isMusicFailureFinal(presenteId)) {

          throw new Error("Geração de música falhou após várias tentativas.");

        }

        return;

      }



      const musicData = await musicRes.json().catch(() => ({}));

      if (musicData.success === false) {

        if (await isMusicFailureFinal(presenteId)) {

          throw new Error(musicData.error || "Geração de música falhou.");

        }

        return;

      }



      logGeneration(presenteId, "music_done", { success: musicData.success });

    }



    logGeneration(presenteId, "video_start", { skipMusic: options.skipMusic });

    const videoRes = await fetch(`${EDGE_URL}/render-video`, {

      method: "POST",

      headers,

      body,

      signal: controller.signal,

    });



    if (!videoRes.ok) {

      const errBody = await videoRes.text();

      console.error("render-video error:", { status: videoRes.status, body: errBody });

      if (videoRes.status === 409) return;

      throw new Error("Renderização de vídeo falhou.");

    }



    const videoData = await videoRes.json().catch(() => ({}));

    logGeneration(presenteId, "video_submitted", { renderId: videoData.renderId });

  } catch (err) {

    const msg = err instanceof Error ? err.message : "Erro desconhecido na geração";

    console.error("triggerGeneration failed:", msg);

    await supabase

      .from("presentes")

      .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })

      .eq("id", presenteId);

    options.onError?.(msg);

  } finally {

    clearTimeout(timeoutId);

  }

}



export async function runStaleGenerationRecovery(maxAgeMinutes = 15): Promise<void> {

  await supabase.rpc("reset_stale_generations", { max_age_minutes: maxAgeMinutes });

}


