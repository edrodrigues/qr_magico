import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type GiftStatus = "draft" | "pending_payment" | "generating" | "ready" | "failed";

export type StepStatus = "pending" | "active" | "done";

export interface GenerationStep {
  id: string;
  label: string;
  status: StepStatus;
}

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
  description?: string;
  createdAt: string;
  attempts?: number;
  generationSteps?: GenerationStep[];
  currentStepMessage?: string;
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

function inferGenerationSteps(row: any): GenerationStep[] {
  const musicStatus = row.musicas?.[0]?.status;
  const musicReady = musicStatus === "ready";
  const videoStarted = !!row.render_request_id;
  const videoReady = !!row.video_url;
  const linkReady = !!row.link;

  return [
    { id: "music", label: "Música personalizada", status: musicReady ? "done" : "active" },
    { id: "video", label: "Vídeo com fotos", status: videoReady ? "done" : videoStarted ? "active" : "pending" },
    { id: "link", label: "Link exclusivo", status: linkReady ? "done" : "pending" },
  ];
}

function getCurrentStepMessage(steps: GenerationStep[]): string {
  const active = steps.find((s) => s.status === "active");
  if (!active) return "Finalizando...";
  switch (active.id) {
    case "music":
      return "Criando sua música personalizada com inteligência artificial...";
    case "video":
      return "Música pronta! Renderizando o vídeo com suas fotos...";
    default:
      return "Preparando os últimos detalhes...";
  }
}

function mapRowToGift(row: any): Gift {
  const status = STATUS_MAP[row.status] || "draft";
  const attempts = row.musicas?.[0]?.attempts ?? 0;
  const steps = status === "generating" ? inferGenerationSteps(row) : undefined;
  const currentMessage = steps ? getCurrentStepMessage(steps) : undefined;
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
    attempts,
    generationSteps: steps,
    currentStepMessage: currentMessage,
    description:
      status === "generating"
        ? currentMessage
        : status === "draft"
          ? `Iniciado em ${new Date(row.created_at).toLocaleDateString("pt-BR")}`
          : status === "failed"
            ? "Falha na geração. Tente novamente."
            : undefined,
    createdAt: row.created_at,
  };
}

export function useGifts() {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    if (!user) {
      setGifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("presentes")
      .select("*, musicas(attempts, status), render_request_id, video_url, link")
      .eq("usuario_id", user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setGifts([]);
    } else {
      setGifts((data || []).map(mapRowToGift));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const stats = {
    total: gifts.length,
    ready: gifts.filter((g) => g.status === "ready").length,
    draft: gifts.filter((g) => g.status === "draft").length,
    pendingPayment: gifts.filter((g) => g.status === "pending_payment").length,
    generating: gifts.filter((g) => g.status === "generating").length,
    payment: gifts.filter((g) => g.status === "pending_payment" || g.status === "generating").length,
  };

  return { gifts, loading, error, stats, refetch: fetchGifts };
}
