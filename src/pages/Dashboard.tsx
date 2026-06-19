import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useGifts, type Gift, type GiftStatus } from "../hooks/useGifts";
import { useToast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Header, Footer } from "../components/Header";
import { supabase } from "../lib/supabase";

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
  style,
}: {
  gift: Gift;
  onCopy: (id: string, link: string) => void;
  copiedId: string | null;
  onDelete: (gift: Gift) => void;
  onConfirmPayment: (id: string) => Promise<void>;
  onRetry?: (gift: Gift) => void;
  style: { animationDelay: string };
}) {
  return (
    <div
      className={cn(
        "glass-card p-6 rounded-xl flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all duration-300 animate-reveal gradient-border-card",
        gift.status === "ready" && "border-l-4 border-l-primary",
        gift.status === "pending_payment" && "grayscale"
      )}
      style={style}
    >
      {gift.status === "ready" && (
        <div className="relative w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-warm-gray">
          <img
            className="w-full h-full object-cover"
            src={gift.thumbnailUrl}
            alt=""
            loading="lazy"
          />
          <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-primary tracking-wider uppercase">
            Premium
          </div>
        </div>
      )}

      {gift.status === "generating" && (
        <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-warm-gray flex items-center justify-center relative">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">
            auto_awesome
          </span>
          <div className="absolute inset-0 shimmer-overlay" />
        </div>
      )}

      {gift.status === "pending_payment" && (
        <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-highest flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-outline">
            shopping_bag
          </span>
        </div>
      )}

      {gift.status === "draft" && (
        <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-warm-gray/50 flex items-center justify-center border-2 border-dashed border-outline-variant/50">
          <span className="material-symbols-outlined text-[40px] text-outline-variant">
            edit_note
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
          <div>
            <h3 className="font-title-lg text-title-lg text-on-surface truncate max-w-[260px] md:max-w-sm">
              {gift.name}
            </h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              {gift.occasion}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm flex-shrink-0",
              gift.status === "ready" && "bg-secondary-container text-on-secondary-container",
              gift.status === "generating" && "bg-gold-glimmer text-secondary",
              gift.status === "pending_payment" && "bg-surface-variant text-on-surface-variant",
              gift.status === "failed" && "bg-error-container text-on-error-container",
              gift.status === "draft" && "bg-warm-gray text-on-surface-variant"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[16px]",
                gift.status === "generating" && "animate-spin"
              )}
            >
              {gift.statusIcon}
            </span>
            {gift.statusLabel}
          </span>
        </div>

          {gift.status === "ready" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-warm-gray/30 rounded-lg border border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Link do Presente
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-primary truncate">{gift.link}</code>
                <button
                  className="p-1 hover:bg-white rounded transition-colors flex-shrink-0"
                  title="Copiar Link"
                  onClick={() => onCopy(gift.id, gift.link!)}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-primary text-[18px]",
                      copiedId === gift.id && "text-green-600"
                    )}
                  >
                    {copiedId === gift.id ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {gift.videoUrl && (
                <a
                  href={gift.videoUrl}
                  download
                  className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-coral-deep transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Baixar V\u00eddeo
                </a>
              )}
              <button className="flex-1 bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                Baixar PDF
              </button>
              <button className="w-10 h-10 border border-outline flex items-center justify-center rounded-lg hover:bg-white transition-all text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            </div>
          </div>
        )}

        {(gift.status === "generating" || gift.status === "failed") && (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 italic">
              {gift.description}
            </p>
            <div className="flex gap-4 mt-4">
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
          </>
        )}

        {gift.status === "pending_payment" && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse-dot" />
              <p className="font-body-md text-body-md text-on-surface-variant flex-1">
                Finalize o pagamento para liberar o presente
              </p>
              <Link
                to={`/wizard/pagamento?draftId=${gift.id}`}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:bg-coral-deep transition-all flex-shrink-0"
              >
                Finalizar Pagamento
              </Link>
              <button
                onClick={() => onDelete(gift)}
                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
              >
                delete
              </button>
            </div>
            <button
              onClick={() => onConfirmPayment(gift.id)}
              className="text-xs text-secondary hover:underline underline-offset-2 transition-all"
            >
              Confirmar pagamento (admin)
            </button>
          </div>
        )}

        {gift.status === "draft" && (
          <div className="flex items-center justify-between mt-4">
            <p className="font-body-md text-body-md text-on-surface-variant italic">
              {gift.description}
            </p>
            <div className="flex gap-3">
              <Link
                to="/wizard/ocasiao-nome"
                className="bg-primary text-on-primary px-5 py-2 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Continuar
              </Link>
              <button
                onClick={() => onDelete(gift)}
                className="w-10 h-10 border border-outline flex items-center justify-center rounded-lg hover:bg-warm-gray transition-all text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
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

  const handleConfirmPayment = async (id: string) => {
    const { error: err } = await supabase
      .from("presentes")
      .update({ status: "generating", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (err) {
      addToast("Erro ao confirmar pagamento", "error");
    } else {
      addToast("Pagamento confirmado! Presente em processamento.", "success");
      refetch();
    }
  };

  const hasProcessing = useMemo(() => gifts.some((g) => g.status === "generating"), [gifts]);

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(refetch, 15000);
    const timeout = setTimeout(() => clearInterval(interval), 300000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [hasProcessing, refetch]);

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
    addToast("Reiniciando geração da música...", "info");
    const { error: resetErr } = await supabase
      .from("musicas")
      .upsert({
        presente_id: gift.id,
        attempts: 0,
        status: "generating",
        last_attempt_at: null,
      }, { onConflict: "presente_id" });
    if (resetErr) {
      addToast("Erro ao reiniciar a geração", "error");
      return;
    }
    const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`;
    try {
      const response = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ presente_id: gift.id }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("retry generate-music error:", response.status, errText);
      }
    } catch (err) {
      console.error("retry generate-music fetch failed:", err);
    }
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
            color="#a93539"
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
                      to="/wizard/ocasiao-nome"
                      className="inline-block mt-3 text-sm font-bold text-secondary hover:underline decoration-2 underline-offset-4"
                    >
                      Continuar editando →
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
