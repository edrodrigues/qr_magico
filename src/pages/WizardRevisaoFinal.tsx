import { useState } from "react";
import { Header, Footer } from "../components/Header";

const SAMPLE_PHOTOS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCxxBK1NulKGLFajxO1kNa6viXYL8GjLVKNjksY64nJlVKskGMnnfplu0lgh_LwaLzXx5hxtqi0yhcIAq6xy_URDSaaAFiWlyNu_1U7dbNzrd4LQe2lBFsODe7tIkYjB6SZQZ1YUNcXRbXeYkxUMEAVEuA9l89BTcs3e-WdvdCLRVmfnlN8EacmUgBwgb9azqjTC5_ybZ9CT0ytttF5OZF3ivQdS90g0ocH9C79cUBhoDaIXEg0_DNjozmaNXVmIpJIyzlqjCNveyI",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDEu2TXIiLMqCVoj80Tqzcae8fhB8LYmvnWOIwmwGTw15EMp7L0Dxfp8NY1925FoZdU-i9VVM_pltySFRFHVjh2JgWTSBZ273wZki2FFEdPnQk46O2BfDKwbpcp25ut3B2DBTh2X9wh5s7G0tZxLlQ6fHedy9U69_C8ZIrZXZjMXjeZerOYFKpqlb1_BVPYo8XDZ8KyxI6ZiOARvKSBMOknVp9kWm3peXgOfu8GzoF4y0znTQTJPB82f8MZVa44euw4y8UUfXSG7sU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHruLa-81PHi7wPorRuBxXm7RZQGbemQjGCBRgshPjxfgTC5W471XXqAnLMHHaWFlY8yPrDd65s85fA3MoGB-mMS_9m9QcF7Ismo4Lyhhjd43fq9tgtViQcsx21TFXwFoZZB-LwGPxM-kyft6dDoyZeqXajHQH4PMhK_zol9IoXcMGUZBwuvDg5-I28X0m9rJ6CfVDpfjSPyrqM2gDJegDZVwSw4Bew1SnHsI8N5aTF9b6okmDQjWbOEL8Cj9RmKLcFYVG5PHYMY0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDiDtiwGu-E0MJ6Q9ZFb5i1PNF5nvvC3_0keVXVH1Ia_0-Q28228MVOBhruTqoULRnGnp3fRJUMy61ccOFDVSDY252ROiAjdkW7QhCs95LpyhPFxjZ8ln5M24kzLMdvt1yz1_pH-9Bao2lLT7D8AWnNx2DtPnTp7BRChnbcqmE2AhglH8dAjJAgTwBxS7IU3Ehk9sbMnpCSyTb1E1Ae6vL7lWlkcI0JboMlDnZ0bMSPvcMzg7t9Ublkj79zVbZyZQVlGh_N0356udQ",
];

const ROTATIONS = ["-2deg", "3deg", "-1deg", "2deg", "-3deg"];

export function WizardRevisaoFinal() {
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
                      Maria Luiza Cavalcanti
                    </span>
                  </div>
                  <div className="flex flex-col border-b border-outline-variant/30 pb-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                      Ocasiao Especial
                    </span>
                    <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                      Anivers&aacute;rio de 30 Anos
                    </span>
                  </div>
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
                        Bossa Nova Instrumental - Premium
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
                    {SAMPLE_PHOTOS.length} fotos
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                  {SAMPLE_PHOTOS.map((src, i) => (
                    <div
                      key={i}
                      className="min-w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 hover:scale-110 hover:rotate-0"
                      style={{ transform: `rotate(${ROTATIONS[i]})` }}
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <div className="min-w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center bg-surface-container-high transition-transform duration-300 hover:scale-110 hover:rotate-0">
                    <span className="font-label-md text-label-md text-primary">
                      +8
                    </span>
                  </div>
                </div>
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

                <button className="w-full border-2 border-outline-variant text-on-surface-variant py-4 rounded-full font-label-md text-label-md font-semibold hover:bg-warm-gray transition-colors flex items-center justify-center gap-2">
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

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
