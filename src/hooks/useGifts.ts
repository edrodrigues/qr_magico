import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type GiftStatus = "draft" | "pending_payment" | "generating" | "ready";

export interface Gift {
  id: string;
  name: string;
  occasion: string;
  status: GiftStatus;
  statusLabel: string;
  statusIcon: string;
  link?: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, GiftStatus> = {
  draft: "draft",
  pending_payment: "pending_payment",
  generating: "generating",
  ready: "ready",
};

const STATUS_LABELS: Record<GiftStatus, string> = {
  draft: "Rascunho",
  pending_payment: "Aguardando pagamento",
  generating: "Gerando trilha sonora",
  ready: "Pronto para entrega",
};

const STATUS_ICONS: Record<GiftStatus, string> = {
  draft: "edit_note",
  pending_payment: "hourglass_empty",
  generating: "sync",
  ready: "celebration",
};

function mapRowToGift(row: any): Gift {
  const status = STATUS_MAP[row.status] || "draft";
  return {
    id: row.id,
    name: row.nome_homenageado,
    occasion: row.ocasiao,
    status,
    statusLabel: STATUS_LABELS[status],
    statusIcon: STATUS_ICONS[status],
    link: row.link || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    description:
      status === "generating"
        ? "Estamos selecionando as melhores melodias para combinar com suas fotos..."
        : status === "draft"
          ? `Iniciado em ${new Date(row.created_at).toLocaleDateString("pt-BR")}`
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
      .select("*")
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
  };

  return { gifts, loading, error, stats, refetch: fetchGifts };
}
