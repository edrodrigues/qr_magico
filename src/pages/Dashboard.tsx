import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useGifts, type Gift, type GiftStatus } from "../hooks/useGifts";
import { useToast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Header, Footer } from "../components/Header";
import { supabase } from "../lib/supabase";
import { getOccasionTheme } from "../remotion/theme";
import { jsPDF } from "jspdf";

type TabId = "all" | "ready" | "drafts" | "payment";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "ready", label: "Prontos" },
  { id: "drafts", label: "Rascunhos" },
  { id: "payment", label: "Pagamento" },
];

const STATUS_TAB_MAP: Record<TabId, GiftStatus[]> = {
  all: [],
  ready: ["ready"],
  drafts: ["draft"],
  payment: ["pending_payment", "generating", "failed"],
};

function getStatusTabCount(gifts: Gift[], tabId: TabId): number {
  if (tabId === "all") return gifts.length;
  const statuses = STATUS_TAB_MAP[tabId];
  return gifts.filter((g) => statuses.includes(g.status)).length;
}

const OCCASION_SUGGESTIONS = [
  "Aniversário",
  "Dia das Mães",
  "Dia dos Namorados",
  "Formatura",
  "Natal",
  "Amizade",
];

function SkeletonCard() {
  return (
    <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row gap-6">
      <div className="skeleton w-full md:w-32 h-32 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-8 w-full mt-4" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 flex-1 min-w-[120px]">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <span className="material-symbols-outlined text-[22px]" style={{ color }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <p className="font-title-lg text-title-lg text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function GiftCard({
  gift,
  onCopy,
  copiedId,
  onDelete,
  onConfirmPayment,
  onRetry,
  onDownload,
  downloadingId,
  onDownloadPdf,
  downloadingPdfId,
  style,
}: {
  gift: Gift;
  onCopy: (id: string, link: string) => void;
  copiedId: string | null;
  onDelete: (gift: Gift) => void;
  onConfirmPayment: (id: string) => Promise<void>;
  onRetry?: (gift: Gift) => void;
  onDownload?: (gift: Gift) => void;
  downloadingId?: string | null;
  onDownloadPdf?: (gift: Gift) => void;
  downloadingPdfId?: string | null;
  style: { animationDelay: string };
}) {
  const [qrLoading, setQrLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (gift.status !== "ready" || !gift.link) return;
    let cancelled = false;
    setQrLoading(true);
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (cancelled) return;
      const url = await QRCode.toDataURL(gift.link!, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      if (cancelled) return;
      setQrDataUrl(url);
      setQrLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [gift.status, gift.link]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `qr-code-${gift.name}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div
      className={cn(
        "glass-card p-6 rounded-xl animate-reveal gradient-border-card transition-all duration-300",
        gift.status === "ready" && "hover:shadow-lg",
        gift.status === "pending_payment" && "grayscale"
      )}
      style={style}
    >
      {gift.status === "ready" && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="relative w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-md">
            {qrLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-warm-gray">
                <span className="material-symbols-outlined text-[36px] text-outline-variant animate-pulse">
                  qr_code_2
                </span>
              </div>
            ) : qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR Code do presente"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleDownloadQr}
                  className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg text-on-surface-variant hover:text-primary hover:bg-white shadow-sm transition-all active:scale-90"
                  title="Baixar QR Code (PNG)"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-warm-gray">
                <span className="material-symbols-outlined text-[36px] text-outline-variant">
                  qr_code_2
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
                  {gift.name}
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {gift.occasion}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {gift.statusIcon}
                </span>
                {gift.statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 my-4 sm:my-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-primary-fixed-dim/30" />
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-[0.15em] uppercase flex-shrink-0">
                <span className="material-symbols-outlined text-[14px] align-middle -mt-0.5 inline-block">share</span>
                {" "}Compartilhe
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary-fixed-dim/30 via-primary/20 to-transparent" />
            </div>

            <div className="bg-gradient-to-r from-primary/[0.06] to-primary-fixed/[0.08] rounded-xl p-1">
              <div className="bg-surface-bright rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-0.5">
                    Link do Presente
                  </p>
                  <code className="text-sm font-mono text-primary truncate block">{gift.link}</code>
                </div>
                <button
                  onClick={() => onCopy(gift.id, gift.link!)}
                  className={cn(
                    "flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200",
                    copiedId === gift.id
                      ? "bg-green-50 text-green-700"
                      : "bg-primary/[0.08] text-primary hover:bg-primary/[0.14] active:scale-95"
                  )}
                  title="Copiar Link"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedId === gift.id ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => onDownload?.(gift)}
                disabled={downloadingId === gift.id}
                className="group flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary to-coral-deep text-on-primary px-4 py-3.5 rounded-xl font-label-md text-label-md hover:shadow-lg hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {downloadingId === gift.id ? "hourglass_top" : "download"}
                </span>
                <span>{downloadingId === gift.id ? "Baixando..." : "Baixar Vídeo"}</span>
              </button>
              <button
                onClick={() => onDownloadPdf?.(gift)}
                disabled={downloadingPdfId === gift.id}
                className="group flex flex-col items-center justify-center gap-2 bg-surface-variant text-on-surface-variant px-4 py-3.5 rounded-xl font-label-md text-label-md hover:bg-surface-container-highest hover:shadow-md active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {downloadingPdfId === gift.id ? "hourglass_top" : "picture_as_pdf"}
                </span>
                <span>{downloadingPdfId === gift.id ? "Gerando PDF..." : "Baixar PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {gift.status === "generating" && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-warm-gray flex items-center justify-center relative">
            <span className="material-symbols-outlined text-[44px] text-outline-variant">
              auto_awesome
            </span>
            <div className="absolute inset-0 shimmer-overlay" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
                  {gift.name}
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {gift.occasion}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-glimmer text-secondary font-label-sm text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  {gift.statusIcon}
                </span>
                {gift.statusLabel}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 italic">
              {gift.description}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                disabled
                onClick={() => onRetry?.(gift)}
                className="font-label-md text-label-md text-outline px-4 py-2 rounded-lg cursor-not-allowed transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => onDelete(gift)}
                className="font-label-md text-label-md text-on-surface-variant px-4 py-2 rounded-lg hover:bg-warm-gray transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {gift.status === "failed" && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-warm-gray flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-outline-variant">
              error_outline
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
                  {gift.name}
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {gift.occasion}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {gift.statusIcon}
                </span>
                {gift.statusLabel}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 italic">
              {gift.description}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onRetry?.(gift)}
                className="font-label-md text-label-md text-primary px-4 py-2 rounded-lg hover:bg-primary-fixed transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => onDelete(gift)}
                className="font-label-md text-label-md text-on-surface-variant px-4 py-2 rounded-lg hover:bg-warm-gray transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {gift.status === "pending_payment" && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-outline">
              shopping_bag
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
                  {gift.name}
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {gift.occasion}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {gift.statusIcon}
                </span>
                {gift.statusLabel}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-dot" />
                <p className="font-body-md text-body-md text-on-surface-variant flex-1 min-w-[160px]">
                  Finalize o pagamento para liberar o presente
                </p>
                <Link
                  to={`/wizard/pagamento?draftId=${gift.id}`}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md hover:bg-coral-deep transition-all flex-shrink-0 shadow-sm"
                >
                  Finalizar Pagamento
                </Link>
                <button
                  onClick={() => onDelete(gift)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-warm-gray hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <button
                onClick={() => onConfirmPayment(gift.id)}
                className="text-xs text-secondary hover:text-secondary/80 hover:underline underline-offset-2 transition-all font-label-md"
              >
                Já paguei (confirmar)
              </button>
            </div>
          </div>
        </div>
      )}

      {gift.status === "draft" && (
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-warm-gray/50 flex items-center justify-center border-2 border-dashed border-outline-variant/50">
            <span className="material-symbols-outlined text-[40px] text-outline-variant">
              edit_note
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
                  {gift.name}
                </h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {gift.occasion}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-gray text-on-surface-variant font-label-sm text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {gift.statusIcon}
                </span>
                {gift.statusLabel}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 italic">
              {gift.description}
            </p>
            <div className="flex items-center justify-between mt-4">
              <div />
              <div className="flex gap-3">
                <Link
                  to={`/wizard/ocasiao-nome?draftId=${gift.id}`}
                  className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Continuar
                </Link>
                <button
                  onClick={() => onDelete(gift)}
                  className="w-10 h-10 border border-outline/40 flex items-center justify-center rounded-lg hover:bg-warm-gray transition-all text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onSelectOccasion }: { onSelectOccasion: (o: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-reveal">
      <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-primary">
          auto_awesome
        </span>
      </div>
      <h3 className="font-headline-md-mobile text-headline-md-mobile md:text-title-lg text-on-surface mb-2">
        Nenhum presente aqui ainda
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-8">
        Comece a criar um Momento Mágico personalizado para alguém especial.
      </p>
      <Link
        to="/wizard/ocasiao-nome"
        className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all shadow-lg mb-8"
      >
        Criar Primeiro Presente
      </Link>
      <div className="w-px h-6 bg-outline-variant/50 mb-6" />
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">
        Sugestões de ocasião:
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {OCCASION_SUGGESTIONS.map((o) => (
          <button
            key={o}
            onClick={() => onSelectOccasion(o)}
            className="px-4 py-2 rounded-full border border-outline-variant/50 text-sm text-on-surface-variant hover:bg-primary-fixed hover:text-primary hover:border-primary/30 transition-all"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-error-container rounded-xl p-6 flex items-start gap-4 animate-slide-up">
      <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0">
        cloud_off
      </span>
      <div className="flex-1">
        <p className="font-label-md text-label-md text-error font-bold mb-1">
          Erro ao carregar presentes
        </p>
        <p className="font-body-md text-body-md text-on-error-container text-sm">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:brightness-110 transition-all flex-shrink-0"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function Dashboard() {
  const { user, session } = useAuth();
  const { gifts, loading, error, stats, refetch } = useGifts();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) return tab as TabId;
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [deleteTarget, setDeleteTarget] = useState<Gift | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const handleConfirmPayment = async (id: string) => {
    const { error: err } = await supabase
      .from("presentes")
      .update({ status: "generating", error_message: "", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) {
      addToast("Erro ao confirmar pagamento", "error");
      return;
    }
    addToast("Pagamento confirmado! Presente em processamento.", "success");

    const { error: resetErr } = await supabase.rpc("upsert_musica", {
      p_presente_id: id,
      p_status: "generating",
      p_attempts: 0,
      p_last_attempt_at: null,
    });
    if (resetErr) {
      console.error("musicas upsert error:", resetErr);
    }

    const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    };
    const body = JSON.stringify({ presente_id: id });

    (async () => {
      try {
        const musicRes = await fetch(`${edgeUrl}/generate-music`, { method: "POST", headers, body });
        if (!musicRes.ok) throw new Error(`generate-music failed: ${musicRes.status}`);
        const videoRes = await fetch(`${edgeUrl}/render-video`, { method: "POST", headers, body });
        if (!videoRes.ok) throw new Error(`render-video failed: ${videoRes.status}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("generation failed:", msg);
        await supabase
          .from("presentes")
          .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })
          .eq("id", id);
        addToast("Erro ao gerar o presente. Tente novamente.", "error");
      }
    })();

    refetch();
  };

  const handleDownload = async (gift: Gift) => {
    if (!session) {
      addToast("Sessão expirada. Faça login novamente.", "error");
      return;
    }
    setDownloadingId(gift.id);
    try {
      const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const res = await fetch(`${edgeUrl}/get-download-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ presente_id: gift.id }),
      });
      const data = await res.json();
      if (data.status === "pending") {
        addToast("O vídeo ainda está sendo gerado. Tente novamente em alguns instantes.", "info");
        return;
      }
      if (!res.ok || !data.download_url) {
        addToast("Erro ao baixar vídeo. Tente novamente.", "error");
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = data.download_url;
      anchor.download = `momento-magico-${gift.name}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      addToast("Erro ao baixar vídeo. Tente novamente.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
  }

  const handleDownloadPdf = async (gift: Gift) => {
    if (!session) {
      addToast("Sessão expirada. Faça login novamente.", "error");
      return;
    }
    setDownloadingPdfId(gift.id);
    try {
      const { data: p, error: err } = await supabase
        .from("presentes")
        .select("*, musicas(lyrics)")
        .eq("id", gift.id)
        .single();

      if (err || !p) {
        addToast("Erro ao buscar dados do presente", "error");
        return;
      }

      const theme = getOccasionTheme(p.ocasiao);
      const [pr, pg, pb] = hexToRgb(theme.primary);
      const [lr, lg, lb] = hexToRgb(theme.lightBgStart);

      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(p.link || "", {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      const doc = new jsPDF({ format: "a5", unit: "mm" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      doc.setFillColor(lr, lg, lb);
      doc.rect(0, 0, pw, ph, "F");

      doc.setDrawColor(pr, pg, pb);
      doc.setLineWidth(0.5);
      doc.rect(8, 8, pw - 16, ph - 16);

      doc.setTextColor(pr, pg, pb);
      doc.setFontSize(22);
      doc.text("Momento M\u00e1gico", pw / 2, 26, { align: "center" });

      const qs = 52;
      doc.addImage(qrDataUrl, "PNG", (pw - qs) / 2, 35, qs, qs);

      let y = 95;
      doc.setFontSize(10);

      const dados: [string, string][] = [
        ["Para", p.nome_homenageado],
        ["De", p.nome_remetente],
        ["Ocasi\u00e3o", p.ocasiao],
        ["Desde", p.data_inicio],
        ["Estilo", p.estilo_musical],
      ];
      dados.forEach(([label, val]) => {
        if (val) {
          doc.setTextColor(29, 29, 28);
          doc.setFont("Helvetica", "bold");
          doc.text(`${label}:`, 20, y);
          doc.setFont("Helvetica", "normal");
          doc.text(val, 48, y);
          y += 7;
        }
      });

      if (p.descricao_relacao) {
        y += 2;
        doc.setDrawColor(86, 86, 85);
        doc.setLineWidth(0.3);
        doc.rect(18, y - 1, pw - 36, 26);
        doc.setTextColor(86, 86, 85);
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(p.descricao_relacao, pw - 44);
        doc.text(lines.slice(0, 5), 24, y + 4);
        y += 32;
      }

      doc.setTextColor(86, 86, 85);
      doc.setFontSize(8);
      doc.text("Escaneie o QR Code para ver o presente especial!", pw / 2, y + 5, { align: "center" });
      doc.text("www.momentomagico.xyz", pw / 2, y + 11, { align: "center" });

      doc.save(`momento-magico-${gift.name}.pdf`);
    } catch {
      addToast("Erro ao gerar PDF", "error");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const checkVideoStatus = useCallback(async (gift: Gift) => {
    if (!session || checkingIds.has(gift.id)) return;
    setCheckingIds((prev) => new Set(prev).add(gift.id));
    try {
      const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const res = await fetch(`${edgeUrl}/get-download-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ presente_id: gift.id }),
      });
      const data = await res.json();
      if (data.status === "ready") {
        refetch();
      }
    } catch {
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(gift.id);
        return next;
      });
    }
  }, [session, checkingIds, refetch]);

  const hasProcessing = useMemo(() => gifts.some((g) => g.status === "generating"), [gifts]);

  const pollingRef = useRef({ refetch, checkVideoStatus, gifts });
  pollingRef.current = { refetch, checkVideoStatus, gifts };

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      const { refetch: rf, checkVideoStatus: cvs, gifts: gs } = pollingRef.current;
      rf();
      gs.filter((g) => g.status === "generating").forEach(cvs);
    }, 15000);
    return () => clearInterval(interval);
  }, [hasProcessing]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === "all" ? {} : { tab: tabId });
  };

  const handleCopy = (id: string, link: string) => {
    navigator.clipboard?.writeText(link);
    setCopiedId(id);
    addToast("Link copiado!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = async (gift: Gift) => {
    if (!session) {
      addToast("Sessão expirada. Faça login novamente.", "error");
      return;
    }
    addToast("Reiniciando geração...", "info");
    const { error: resetErr } = await supabase.rpc("upsert_musica", {
      p_presente_id: gift.id,
      p_status: "generating",
      p_attempts: 0,
      p_last_attempt_at: null,
    });
    if (resetErr) {
      console.error("musicas retry upsert error:", { code: resetErr.code, message: resetErr.message, details: resetErr.details, presente_id: gift.id });
      addToast(`Erro ao reiniciar a geração (${resetErr.code})`, "error");
      return;
    }
    const { error: presenteErr } = await supabase
      .from("presentes")
      .update({ status: "generating", error_message: "", updated_at: new Date().toISOString() })
      .eq("id", gift.id);
    if (presenteErr) {
      console.error("presente status update error:", presenteErr);
      addToast("Erro ao reiniciar a geração", "error");
      return;
    }
    const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    };
    const body = JSON.stringify({ presente_id: gift.id });
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      try {
        const musicRes = await fetch(`${edgeUrl}/generate-music`, { method: "POST", headers, body, signal: controller.signal });
        if (!musicRes.ok) {
          const errBody = await musicRes.text();
          console.error("generate-music error body:", { status: musicRes.status, body: errBody });
          throw new Error(`generate-music failed: ${musicRes.status}`);
        }
        const videoRes = await fetch(`${edgeUrl}/render-video`, { method: "POST", headers, body, signal: controller.signal });
        if (!videoRes.ok) throw new Error(`render-video failed: ${videoRes.status}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("retry generation failed:", msg);
        await supabase.from("presentes").update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() }).eq("id", gift.id);
        addToast("Erro ao gerar o presente. Tente novamente.", "error");
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error: err } = await supabase
      .from("presentes")
      .update({ status: "cancelled" })
      .eq("id", deleteTarget.id);
    if (err) {
      addToast("Erro ao excluir presente", "error");
    } else {
      addToast("Presente excluído", "success");
      refetch();
    }
    setDeleteTarget(null);
  };

  const handleSelectOccasion = (occasion: string) => {
    addToast(`Vamos criar um presente para "${occasion}"!`, "info");
  };

  const filteredGifts = useMemo(() => {
    let result = gifts;

    const statuses = STATUS_TAB_MAP[activeTab];
    if (statuses.length > 0) {
      result = result.filter((g) => statuses.includes(g.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) || g.occasion.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "oldest")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [gifts, activeTab, searchQuery, sortBy]);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="pt-24 pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <header className="mb-8 animate-reveal">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">
              {userInitial}
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Olá, <span className="text-primary font-bold">{userName}</span>
              </p>
              <h1 className="font-headline-md-mobile md:text-headline-md text-headline-md text-on-surface">
                Meus Momentos Mágicos
              </h1>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-3 mb-8 animate-reveal" style={{ animationDelay: "0.1s" }}>
          <StatCard label="Prontos" value={stats.ready} icon="check_circle" color="#2e7d32" />
          <StatCard label="Rascunhos" value={stats.draft} icon="edit_note" color="#735c00" />
          <StatCard
            label="Pagamento"
            value={stats.payment}
            icon="hourglass_empty"
            color="#C96442"
          />
          <StatCard label="Total" value={stats.total} icon="redeem" color="#615e5b" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-reveal" style={{ animationDelay: "0.15s" }}>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nome ou ocasião..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2.5 rounded-lg bg-surface border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 animate-reveal" style={{ animationDelay: "0.2s" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-all flex-shrink-0",
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-higher"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-outline-variant/50 text-on-surface-variant"
                )}
              >
                {getStatusTabCount(gifts, tab.id)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-gutter-desktop">
          <div className="flex-1 space-y-6">
            {loading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {!loading && error && <ErrorBanner message={error} onRetry={refetch} />}

            {!loading && !error && filteredGifts.length === 0 && (
              <EmptyState onSelectOccasion={handleSelectOccasion} />
            )}

            {!loading &&
              !error &&
              filteredGifts.map((gift, i) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                  onDelete={setDeleteTarget}
                  onConfirmPayment={handleConfirmPayment}
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  downloadingId={downloadingId}
                  onDownloadPdf={handleDownloadPdf}
                  downloadingPdfId={downloadingPdfId}
                  style={{ animationDelay: `${0.3 + i * 0.08}s` }}
                />
              ))}
          </div>

          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-primary-fixed p-6 rounded-xl relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h4 className="font-title-lg text-title-lg text-on-primary-fixed mb-4">
                  Como funciona a entrega?
                </h4>
                <div className="space-y-4">
                  {[
                    "Baixe o PDF com o design exclusivo.",
                    "Imprima ou envie o QR Code para a pessoa.",
                    "Ela escaneia e a mágica acontece!",
                  ].map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-on-primary-fixed-variant">{step}</p>
                    </div>
                  ))}
                </div>
                {stats.total === 0 && (
                  <Link
                    to="/wizard/ocasiao-nome"
                    className="mt-6 block w-full text-center bg-primary text-on-primary px-4 py-3 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all"
                  >
                    Criar Primeiro Presente
                  </Link>
                )}
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-primary/10 rotate-12 pointer-events-none">
                redeem
              </span>
            </div>

            <Link
              to="/dashboard/creditos"
              className="glass-card p-5 rounded-xl flex items-center gap-4 hover:shadow-md transition-all group"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">
                redeem
              </span>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">
                  Créditos
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  Resgate cupons e gere grátis
                </p>
              </div>
              <span className="material-symbols-outlined text-outline ml-auto text-[20px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>

            {user?.email === "ed.ufpe@gmail.com" && (
              <Link
                to="/admin"
                className="glass-card p-5 rounded-xl flex items-center gap-4 hover:shadow-md transition-all group border border-primary/20"
              >
                <span className="material-symbols-outlined text-primary text-[28px]">
                  admin_panel_settings
                </span>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">
                    Admin
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Gerenciar cupons e usuários
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline ml-auto text-[20px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
            )}

            {stats.draft > 0 && (
              <div className="glass-card p-5 rounded-xl border-l-4 border-l-secondary">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[24px]">
                    lightbulb
                  </span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold mb-1">
                      Você tem {stats.draft} rascunho{stats.draft > 1 ? "s" : ""}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                      Que tal finalizar agora e surpreender alguém especial?
                    </p>
                    <Link
                      to="/dashboard?tab=drafts"
                      className="inline-block mt-3 text-sm font-bold text-secondary hover:underline decoration-2 underline-offset-4"
                    >
                      Ver rascunhos →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Link
        to="/wizard/ocasiao-nome"
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 bg-primary text-on-primary px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 scale-100 hover:scale-105 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
        <span className="font-label-md text-label-md hidden sm:inline">Criar Novo Momento Mágico</span>
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity shimmer-overlay" />
      </Link>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir presente"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .shimmer-overlay {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
