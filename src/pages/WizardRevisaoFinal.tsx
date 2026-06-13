import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { cn } from "../lib/utils";

const ROTATIONS = ["-2deg", "3deg", "-1deg", "2deg", "-3deg"];

const OCCASION_LABELS: Record<string, string> = {
  aniversario: "Aniversário",
  amor: "Amor",
  amizade: "Amizade",
  gratidao: "Gratidão",
  outro: "Outro",
};

const STYLE_LABELS: Record<string, string> = {
  mpb: "MPB",
  pop: "Pop",
  piano: "Piano Solo",
  lofi: "Lo-fi",
  sertanejo: "Sertanejo",
};

export function WizardRevisaoFinal() {
  const navigate = useNavigate();
  const { data } = useWizard();
  const [termsChecked, setTermsChecked] = useState(false);

  return (
    <div className="bg-soft-cream font-body-md text-on-surface min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <Header showNav />

      <main className="min-h-screen pt-8 pb-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12 max-w-xs mx-auto">
            <div className="flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md">
                5
              </span>
              <span className="font-label-sm text-label-sm text-primary">
                Revis&atilde;o
              </span>
            </div>
            <div className="flex-1 h-[2px] bg-outline-variant mx-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full transition-all duration-700 ease-out" />
            </div>
            <div className="flex flex-col items-center gap-2 opacity-40">
              <span className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-md text-label-md">
                6
              </span>
              <span className="font-label-sm text-label-sm">Pagamento</span>
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4">
              Tudo pronto para a magia?
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Confira os detalhes do seu presente antes de gerarmos a
              retrospectiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-desktop">
            <div className="md:col-span-7 space-y-gutter-desktop">
              <section className="glass-card rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    Resumo da Homenagem
                  </h2>
                  <button className="text-primary hover:text-coral-deep transition-colors flex items-center gap-1 font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                    Editar
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col border-b border-outline-variant/30 pb-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Para quem &eacute;?
                    </span>
                    <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                      {data.name || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-outline-variant/30 pb-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Ocasiao Especial
                    </span>
                    <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                      {OCCASION_LABELS[data.occasion] || data.occasion || "—"}
                    </span>
                  </div>
                  {data.story && (
                    <div className="flex flex-col border-b border-outline-variant/30 pb-4">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Hist&oacute;ria
                      </span>
                      <span className="font-body-md text-body-md text-on-surface leading-relaxed">
                        {data.story}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Trilha Sonora
                    </span>
                    <div className="flex items-center gap-3 mt-2 bg-warm-gray p-3 rounded-lg">
                      <span
                        className="material-symbols-outlined text-secondary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        music_note
                      </span>
                      <span className="font-body-md text-body-md font-medium">
                        {STYLE_LABELS[data.musicStyle] || data.musicStyle || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-title-lg text-title-lg text-primary">
                    Momentos Selecionados
                  </h2>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {data.photos.length} fotos
                  </span>
                </div>
                {data.photos.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {data.photos.map((photo, i) => (
                      <div
                        key={i}
                        className="min-w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 hover:scale-110 hover:rotate-0"
                        style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}
                      >
                        <img
                          src={photo.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[120px] bg-warm-gray rounded-lg">
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      Nenhuma foto enviada
                    </span>
                  </div>
                )}
              </section>
            </div>

            <div className="md:col-span-5">
              <div className="sticky top-24 space-y-6">
                <section className="glass-card rounded-xl p-8 shadow-md border-primary/10 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-glimmer/30 rounded-full blur-3xl" />
                  <h2 className="font-title-lg text-title-lg text-primary mb-8">
                    Resumo do Pedido
                  </h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between font-body-md text-body-md">
                      <span className="text-on-surface-variant">
                        V&iacute;deo Retrospectiva IA
                      </span>
                      <span className="text-on-surface">R$ 49,90</span>
                    </div>
                    <div className="flex justify-between font-body-md text-body-md">
                      <span className="text-on-surface-variant">
                        Impress&atilde;o QR Card (Opcional)
                      </span>
                      <span className="text-on-surface">R$ 15,00</span>
                    </div>
                    <div className="flex justify-between font-body-md text-body-md">
                      <span className="text-on-surface-variant">
                        Taxa de Magia
                      </span>
                      <span className="text-secondary">Gr&aacute;tis</span>
                    </div>
                    <div className="pt-4 border-t border-outline-variant">
                      <div className="flex justify-between items-end">
                        <span className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                          Total
                        </span>
                        <div className="text-right">
                          <span className="font-display-lg-mobile text-display-lg-mobile text-primary leading-none block">
                            R$ 64,90
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            at&eacute; 3x no cart&atilde;o
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-1">
                        <input
                          type="checkbox"
                          checked={termsChecked}
                          onChange={(e) => setTermsChecked(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            "w-5 h-5 border-2 border-outline rounded flex items-center justify-center transition-all",
                            termsChecked
                              ? "bg-primary border-primary"
                              : "border-outline"
                          )}
                        >
                          {termsChecked && (
                            <span className="material-symbols-outlined text-white text-[16px]">
                              check
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                        Li e aceito os{" "}
                        <a className="text-primary underline font-semibold" href="#">
                          Termos de Uso
                        </a>{" "}
                        e a{" "}
                        <a className="text-primary underline font-semibold" href="#">
                          Pol&iacute;tica de Privacidade
                        </a>{" "}
                        do QR M&aacute;gico.
                      </span>
                    </label>
                  </div>

                  <button
                    disabled={!termsChecked}
                    onClick={() => navigate("/wizard/pagamento")}
                    className={cn(
                      "w-full py-4 rounded-full font-label-md text-label-md font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group",
                      termsChecked
                        ? "bg-primary text-on-primary hover:bg-coral-deep active:scale-[0.98]"
                        : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
                    )}
                  >
                    Ir para o Pagamento
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                  <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      lock
                    </span>
                    Ambiente 100% Seguro
                  </p>
                </section>

                <button
                  onClick={() => navigate("/wizard/upload-fotos")}
                  className="w-full border-2 border-outline-variant text-on-surface-variant py-4 rounded-full font-label-md text-label-md font-semibold hover:bg-warm-gray transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                  Voltar para as fotos
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


