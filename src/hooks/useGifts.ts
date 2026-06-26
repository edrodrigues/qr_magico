import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  inferGenerationSteps,
  getStepMessage,
  getGenerationPhase,
  isGenerationStuck,
  type GenerationStep,
  type GenerationPhase,
  type StepStatus,
} from "../lib/generation";

export type GiftStatus = "draft" | "pending_payment" | "generating" | "ready" | "failed";

export type { GenerationStep, GenerationPhase, StepStatus };

export interface Gift {
  id: string;
  name: string;
  occasion: string;
  status: GiftStatus;
  statusLabel: string;
  statusIcon: string;
  link?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  musicStatus?: string;
  musicAttempts?: number;
  musicLastAttemptAt?: string;
  errorMessage?: string;
  generationStartedAt?: string;
  description?: string;
  createdAt: string;
  attempts?: number;
  generationSteps?: GenerationStep[];
  currentStepMessage?: string;
  generationPhase?: GenerationPhase;
  isStuck?: boolean;
}

const STATUS_MAP: Record<string, GiftStatus> = {
  draft: "draft",
  pending_payment: "pending_payment",
  generating: "generating",
  ready: "ready",
  failed: "failed",
};

const STATUS_LABELS: Record<GiftStatus, string> = {
  draft: "Rascunho",
  pending_payment: "Em pagamento",
  generating: "Em processamento",
  ready: "Prontos",
  failed: "Falha",
};

const STATUS_ICONS: Record<GiftStatus, string> = {
  draft: "edit_note",
  pending_payment: "hourglass_empty",
  generating: "sync",
  ready: "celebration",
  failed: "error",
};

function mapRowToGift(row: any): Gift {
  const status = STATUS_MAP[row.status] || "draft";
  const musicRow = row.musicas?.[0];
  const attempts = musicRow?.attempts ?? 0;
  const musicStatus = musicRow?.status;
  const musicUrl = musicRow?.url_audio;
  const musicLastAttemptAt = musicRow?.last_attempt_at;
  const errorMessage = row.error_message || undefined;
  const steps = status === "generating" ? inferGenerationSteps(row) : undefined;
  const currentMessage = steps ? getStepMessage(steps, errorMessage) : undefined;
  const generationPhase = steps ? getGenerationPhase(steps) : undefined;
  const musicReady = musicStatus === "ready" || !!musicUrl;

  const createdAt = row.created_at;
  const generationStartedAt = row.generation_started_at || undefined;
  const isStuck = isGenerationStuck(
    status,
    createdAt,
    musicLastAttemptAt,
    generationStartedAt,
  );

  return {
    id: row.id,
    name: row.nome_homenageado,
    occasion: row.ocasiao,
    status,
    statusLabel: STATUS_LABELS[status],
    statusIcon: STATUS_ICONS[status],
    link: row.link || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    videoUrl: row.video_url || undefined,
    musicUrl: musicUrl || undefined,
    musicStatus: musicStatus || undefined,
    musicAttempts: attempts,
    musicLastAttemptAt: musicLastAttemptAt || undefined,
    errorMessage,
    generationStartedAt: row.generation_started_at || undefined,
    attempts,
    generationSteps: steps,
    currentStepMessage: currentMessage,
    generationPhase,
    isStuck,
    description:
      status === "generating"
        ? currentMessage
        : status === "draft"
          ? `Iniciado em ${new Date(createdAt).toLocaleDateString("pt-BR")}`
          : status === "failed"
            ? errorMessage ||
              (musicReady
                ? "Música pronta — falha apenas no vídeo. Tente novamente."
                : "Falha na geração. Tente novamente.")
            : undefined,
    createdAt,
  };
}

function stepsEqual(a?: GenerationStep[], b?: GenerationStep[]): boolean {
  if (!a && !b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((step, i) => step.id === b[i].id && step.status === b[i].status);
}

function giftsAreEqual(prev: Gift[], next: Gift[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((gift, i) => {
    const other = next[i];
    return (
      gift.id === other.id &&
      gift.status === other.status &&
      gift.link === other.link &&
      gift.videoUrl === other.videoUrl &&
      gift.musicUrl === other.musicUrl &&
      gift.musicStatus === other.musicStatus &&
      gift.musicAttempts === other.musicAttempts &&
      gift.errorMessage === other.errorMessage &&
      gift.isStuck === other.isStuck &&
      gift.currentStepMessage === other.currentStepMessage &&
      gift.description === other.description &&
      stepsEqual(gift.generationSteps, other.generationSteps)
    );
  });
}

export function useGifts() {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async (silent = false) => {
    if (!user) {
      setGifts([]);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const { data, error: err } = await supabase
      .from("presentes")
      .select(
        "*, musicas(attempts, status, url_audio, last_attempt_at), render_request_id, video_url, link, error_message, generation_started_at",
      )
      .eq("usuario_id", user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (err) {
      if (!silent) {
        setError(err.message);
        setGifts([]);
      }
    } else {
      const mapped = (data || []).map(mapRowToGift);
      setGifts((prev) => (giftsAreEqual(prev, mapped) ? prev : mapped));
    }

    if (!silent) setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGifts(false);
  }, [fetchGifts]);

  const refetch = useCallback(() => fetchGifts(true), [fetchGifts]);

  const stats = {
    total: gifts.length,
    ready: gifts.filter((g) => g.status === "ready").length,
    draft: gifts.filter((g) => g.status === "draft").length,
    pendingPayment: gifts.filter((g) => g.status === "pending_payment").length,
    generating: gifts.filter((g) => g.status === "generating").length,
    payment: gifts.filter((g) => g.status === "pending_payment" || g.status === "generating").length,
  };

  return { gifts, loading, error, stats, refetch };
}
