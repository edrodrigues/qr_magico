import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";

const PRECO_UNITARIO_CENTAVOS = 1990;
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function WizardPagamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: wizardData, draftId, saveDraft, setDraftId, isSaving, resetWizard } = useWizard();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const { addToast } = useToast();

  const existingDraftId = searchParams.get("draftId");
  const { user, session } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("obter_saldo_creditos").then(({ data }) => {
      setSaldo(data as number);
    });
  }, [user]);

  useEffect(() => {
    if (existingDraftId) {
      setDraftId(existingDraftId);
    }
  }, [existingDraftId, setDraftId]);

  const handlePagar = async () => {
    if (saldo !== null && saldo > 0) {
      const { error: consumeError } = await supabase.rpc("consumir_credito");
      if (consumeError) {
        addToast("Erro ao consumir crédito. Saldo insuficiente.", "error");
        return;
      }

      const result = await saveDraft({ status: "generating" });
      if (result.error) {
        addToast("Erro ao processar", "error");
        return;
      }

      const presenteId = result.id || existingDraftId || draftId;
      if (!presenteId) {
        addToast("Erro ao localizar o presente", "error");
        return;
      }

      await dispararGeracao(presenteId);
      resetWizard();
      navigate("/dashboard");
      return;
    }

    setLoadingLink(true);
    try {
      const result = await saveDraft({ status: "pending_payment" });
      if (result.error) {
        addToast("Erro ao salvar rascunho", "error");
        return;
      }

      const presenteId = result.id || existingDraftId || draftId;
      if (!presenteId) {
        addToast("Erro ao localizar o presente", "error");
        return;
      }

      const linkRes = await fetch(`${EDGE_URL}/create-infinitepay-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          tipo: "presente",
          presente_id: presenteId,
          valor_centavos: PRECO_UNITARIO_CENTAVOS,
          customer: {
            name: wizardData.remetente || user?.user_metadata?.full_name || "",
            email: user?.email || "",
          },
        }),
      });

      if (!linkRes.ok) {
        const errBody = await linkRes.text();
        console.error("create-infinitepay-link error:", errBody);
        addToast("Erro ao criar link de pagamento. Tente novamente.", "error");
        return;
      }

      const { checkout_url } = await linkRes.json();
      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        addToast("Erro: link de pagamento não recebido", "error");
      }
    } catch (err) {
      console.error("handlePagar error:", err);
      addToast("Erro ao processar pagamento", "error");
    } finally {
      setLoadingLink(false);
    }
  };

  const dispararGeracao = async (presenteId: string) => {
    const linkSlug = (await supabase.from("presentes").select("slug").eq("id", presenteId).single()).data?.slug;
    if (presenteId && linkSlug) {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const link = `${appUrl}/p/${linkSlug}`;
      await supabase.from("presentes").update({ link }).eq("id", presenteId);
    }

    const { error: musicaError } = await supabase.rpc("upsert_musica", {
      p_presente_id: presenteId,
      p_status: "generating",
      p_estilo: wizardData.musicStyle || "gerando",
      p_attempts: 0,
      p_last_attempt_at: null,
    });
    if (musicaError) {
      console.error("musicas upsert error:", musicaError);
      addToast("Erro ao preparar a música", "error");
      return;
    }

    if (wizardData.photos.length > 0) {
      const photoInserts = wizardData.photos
        .filter((photo) => photo.storageUrl)
        .map((photo, index) => ({
          presente_id: presenteId,
          url: photo.storageUrl!,
          ordem: index,
        }));
      if (photoInserts.length > 0) {
        const { error: fotoError } = await supabase.from("fotos").insert(photoInserts);
        if (fotoError) console.error("fotos insert error:", fotoError);
      }
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    };
    const body = JSON.stringify({ presente_id: presenteId });

    (async () => {
      try {
        const musicRes = await fetch(`${EDGE_URL}/generate-music`, { method: "POST", headers, body });
        if (!musicRes.ok) throw new Error(`generate-music failed: ${musicRes.status}`);
        const videoRes = await fetch(`${EDGE_URL}/render-video`, { method: "POST", headers, body });
        if (!videoRes.ok) throw new Error(`render-video failed: ${videoRes.status}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("generation failed:", msg);
        await supabase
          .from("presentes")
          .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })
          .eq("id", presenteId);
        addToast("Erro ao gerar o presente. Tente novamente.", "error");
      }
    })();
  };

  return (
    <div className="bg-soft-cream text-on-surface font-body-md min-h-screen">
      <Header showNav />

      <main className="pt-28 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-primary mb-2">
            Finalizar presente
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {saldo !== null && saldo > 0
              ? "Você tem créditos disponíveis! Gere seu Momento Mágico gratuitamente."
              : "Escolha a melhor forma de pagamento para você."}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {saldo !== null && saldo > 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-primary/30 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-primary text-[64px] mb-4">
                  redeem
                </span>
                <h2 className="font-title-lg text-title-lg text-on-surface mb-2">
                  Crédito disponível!
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-sm">
                  Você tem créditos disponíveis. Clique no botão abaixo para gerar seu
                  Momento Mágico.
                </p>
                <button
                  onClick={handlePagar}
                  disabled={isSaving}
                  className="bg-primary text-on-primary px-10 py-4 rounded-full font-headline-md-mobile text-headline-md-mobile shadow-lg shadow-primary/20 hover:brightness-110 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[22px] animate-spin">refresh</span>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                      Gerar Grátis
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="glass-panel p-8 rounded-2xl border border-outline-variant/30 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-primary text-[64px] mb-4">
                    qr_code_2
                  </span>
                  <h2 className="font-title-lg text-title-lg text-on-surface mb-2">
                    Pagamento via InfinityPay
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-sm">
                    Você será redirecionado para o checkout seguro da InfinityPay.
                    Após a confirmação do pagamento, seu Momento Mágico será gerado automaticamente.
                  </p>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">pix</span>
                      <span className="font-label-md text-label-md text-on-surface">PIX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">credit_card</span>
                      <span className="font-label-md text-label-md text-on-surface">Cartão</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-8 py-4 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Pagamento Seguro
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">lock</span>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      SSL Encriptado
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="glass-panel p-8 rounded-2xl border border-outline-variant/30 sticky top-32">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-6">
                Resumo do pedido
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-warm-gray overflow-hidden flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline-variant">card_giftcard</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">QR Mágico</p>
                      <p className="text-xs text-on-surface-variant">Presente personalizado com IA</p>
                    </div>
                  </div>
                  <p className="font-label-md text-label-md">{saldo !== null && saldo > 0 ? "Grátis" : "R$ 19,90"}</p>
                </div>
                <div className="border-t border-outline-variant/20 pt-4 flex justify-between">
                  <span className="font-body-md text-body-md text-on-surface-variant">Subtotal</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {saldo !== null && saldo > 0 ? "Grátis" : "R$ 19,90"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Total a pagar</p>
                  <p className="font-headline-md-mobile text-headline-md-mobile text-primary font-bold">
                    {saldo !== null && saldo > 0 ? "Grátis" : "R$ 19,90"}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePagar}
                disabled={isSaving || loadingLink}
                className="w-full bg-primary text-on-primary py-5 rounded-full font-headline-md-mobile text-headline-md-mobile shadow-lg shadow-primary/20 hover:bg-coral-deep transition-all transform active:scale-95 mb-4 disabled:opacity-50"
              >
                {isSaving || loadingLink ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[22px] animate-spin">refresh</span>
                    {loadingLink ? "Redirecionando..." : "Gerando..."}
                  </span>
                ) : (
                  saldo !== null && saldo > 0 ? "Gerar Grátis" : "Ir para Pagamento"
                )}
              </button>
              <p className="text-center text-xs text-on-surface-variant leading-relaxed">
                {saldo !== null && saldo > 0
                  ? "Seus créditos cobrem o valor integral do presente."
                  : `Ao clicar em "Ir para Pagamento", você será redirecionado ao checkout seguro.`}
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
