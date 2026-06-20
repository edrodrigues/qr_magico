import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

type PaymentMethod = "pix" | "card";

export function WizardPagamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: wizardData, draftId, saveDraft, setDraftId, isSaving, resetWizard } = useWizard();
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const { addToast } = useToast();

  const existingDraftId = searchParams.get("draftId");
  const { session } = useAuth();

  useEffect(() => {
    if (existingDraftId) {
      setDraftId(existingDraftId);
    }
  }, [existingDraftId, setDraftId]);

  const handlePagar = async () => {
    const result = await saveDraft({ status: "generating" });

    if (result.error) {
      addToast("Erro ao processar pagamento", "error");
      return;
    }

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    // presenteId is the database UUID from wizard context or URL param
    let presenteId = existingDraftId || draftId;

    // Fallback: saveDraft did a fresh INSERT — fetch id from the returned slug
    if (!presenteId && result.slug) {
      const { data } = await supabase
        .from("presentes")
        .select("id")
        .eq("slug", result.slug)
        .single();
      if (data) presenteId = data.id;
    }

    if (!presenteId) {
      addToast("Erro ao localizar o presente", "error");
      return;
    }

    // Ensure the public link is set using presente_id (UUID) not slug
    const linkSlug = result.slug;
    if (presenteId && linkSlug) {
      const link = `${appUrl}/p/${linkSlug}`;
      await supabase.from("presentes").update({ link }).eq("id", presenteId);
    } else if (presenteId) {
      const { data: presente } = await supabase
        .from("presentes")
        .select("slug")
        .eq("id", presenteId)
        .single();
      if (presente?.slug) {
        const link = `${appUrl}/p/${presente.slug}`;
        await supabase.from("presentes").update({ link }).eq("id", presenteId);
      }
    }

    const { error: musicaError } = await supabase.from("musicas").upsert({
      presente_id: presenteId,
      estilo: wizardData.musicStyle || "gerando",
      status: "generating",
      attempts: 0,
      last_attempt_at: null,
    }, { onConflict: "presente_id" });
    if (musicaError) {
      addToast("Erro ao preparar a música", "error");
      console.error("musicas upsert error:", musicaError);
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
        if (fotoError) {
          console.error("fotos insert error:", fotoError);
        }
      }
    }

    const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`;
    let musicOk = false;
    try {
      const response = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ presente_id: presenteId }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("generate-music returned error:", response.status, errText);
        addToast(`Erro na geração da música (${response.status})`, "error");
      } else {
        musicOk = true;
      }
    } catch (err) {
      console.error("Failed to call generate-music edge function:", err);
      addToast("A geração da música pode estar atrasada", "info");
    }

    // Only trigger render-video if music generation was scheduled successfully
    if (musicOk) {
      const renderUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/render-video`;
      try {
        const response = await fetch(renderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ presente_id: presenteId }),
        });
        if (!response.ok) {
          const errText = await response.text();
          console.error("render-video returned error:", response.status, errText);
        }
      } catch (err) {
        console.error("Failed to call render-video edge function:", err);
      }
    }

    resetWizard();
    navigate("/dashboard");
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
            Escolha a melhor forma de pagamento para voc&ecirc;.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMethod("pix")}
                className={cn(
                  "flex items-center justify-center gap-3 p-6 rounded-xl border-2 glass-panel transition-all duration-300",
                  method === "pix"
                    ? "border-primary bg-surface-container-low"
                    : "border-outline-variant"
                )}
              >
                <span className="material-symbols-outlined text-primary">
                  qr_code_2
                </span>
                <div className="text-left">
                  <p className="font-label-md text-label-md text-on-surface">
                    PIX
                  </p>
                  <p className="text-xs text-secondary font-semibold">
                    R&aacute;pido e seguro
                  </p>
                </div>
              </button>
              <button
                onClick={() => setMethod("card")}
                className={cn(
                  "flex items-center justify-center gap-3 p-6 rounded-xl border-2 glass-panel transition-all duration-300",
                  method === "card"
                    ? "border-primary bg-surface-container-low"
                    : "border-outline-variant"
                )}
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  credit_card
                </span>
                <div className="text-left">
                  <p className="font-label-md text-label-md text-on-surface">
                    Cart&atilde;o
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    D&eacute;bito ou cr&eacute;dito &agrave; vista
                  </p>
                </div>
              </button>
            </div>

            {method === "pix" && (
              <div className="glass-panel p-8 rounded-2xl border border-outline-variant/30 flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-xl shadow-inner mb-6 relative">
                  <img
                    alt="QR Code PIX"
                    className="w-48 h-48 opacity-90"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuADlRrD1BjMp04tGDLv2wzGQQVV_X5RyUcz_D6rWkE9r_PhhXzuulp8nWXTblztro8gHTg1LqCCn7qwmCET350gOe1nqurCPth9cHatFddpBcdy9ztWp8WQ8gAIWizN860fYRtB20m-Il3Q_UyH6qyqKjClg5mRO1Ou_ZZFBZ_0B3oC1VOsrR-QWiTk6Fh7UJD0cWUmFnLOMnMftNDGxVe99Dps0Gw1_I8VdDOhcJf_9neyqeAhXZKgqlFb_l5Ui0OvBCMcvjSSjJc"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-primary text-4xl opacity-20">
                      magic_button
                    </span>
                  </div>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
                  Escaneie para pagar
                </h3>
                <p className="text-on-surface-variant font-body-md mb-6 max-w-sm">
                  Acesse o app do seu banco e escolha a op&ccedil;&atilde;o
                  pagar via PIX Escanear QR Code.
                </p>
                <button className="flex items-center gap-2 text-primary font-label-md text-label-md hover:underline">
                  <span className="material-symbols-outlined text-sm">
                    content_copy
                  </span>
                  Copiar c&oacute;digo PIX
                </button>
              </div>
            )}

            {method === "card" && (
              <div className="glass-panel p-8 rounded-2xl border border-outline-variant/30">
                <form className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                      N&uacute;mero do Cart&atilde;o
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-warm-gray border-none rounded-lg p-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:border-secondary-container"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                      Nome Impresso
                    </label>
                    <input
                      type="text"
                      placeholder="Como no cartão"
                      className="w-full bg-warm-gray border-none rounded-lg p-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:border-secondary-container"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                      Validade
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full bg-warm-gray border-none rounded-lg p-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:border-secondary-container"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full bg-warm-gray border-none rounded-lg p-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary-focus focus:border-secondary-container"
                    />
                  </div>
                </form>
                <div className="mt-8 pt-8 border-t border-outline-variant/20 flex gap-4">
                  <div className="flex-1 p-3 border border-outline-variant rounded-lg flex items-center justify-center">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold tracking-wider opacity-70">
                      visa
                    </span>
                  </div>
                  <div className="flex-1 p-3 border border-outline-variant rounded-lg flex items-center justify-center">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold tracking-wider opacity-70">
                      mc
                    </span>
                  </div>
                  <div className="flex-1 p-3 border border-outline-variant rounded-lg flex items-center justify-center">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase font-bold tracking-wider opacity-70">
                      pp
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center items-center gap-8 py-4 opacity-60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  verified_user
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pagamento Seguro
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  lock
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  SSL Encriptado
                </span>
              </div>
            </div>
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
                      <span className="material-symbols-outlined text-outline-variant">
                        card_giftcard
                      </span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">
                        QR M&aacute;gico
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Presente personalizado com IA
                      </p>
                    </div>
                  </div>
                  <p className="font-label-md text-label-md">R$ 19,90</p>
                </div>
                <div className="border-t border-outline-variant/20 pt-4 flex justify-between">
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    Subtotal
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">
                    R$ 19,90
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Total a pagar
                  </p>
                  <p className="font-headline-md-mobile text-headline-md-mobile text-primary font-bold">
                    R$ 19,90
                  </p>
                </div>
              </div>
              <button
                onClick={handlePagar}
                disabled={isSaving}
                className="w-full bg-primary text-on-primary py-5 rounded-full font-headline-md-mobile text-headline-md-mobile shadow-lg shadow-primary/20 hover:bg-coral-deep transition-all transform active:scale-95 mb-4 disabled:opacity-50"
              >
                {isSaving ? "Processando..." : "Pagar Agora"}
              </button>
              <p className="text-center text-xs text-on-surface-variant leading-relaxed">
                Ao clicar em &quot;Pagar Agora&quot;, voc&ecirc; concorda com
                nossos{" "}
                <a className="underline" href="#">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a className="underline" href="#">
                  Pol&iacute;ticas de Privacidade
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}


