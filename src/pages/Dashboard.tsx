import { useState } from "react";
import { cn } from "../lib/utils";
import { Header, Footer } from "../components/Header";

export function Dashboard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const gifts = [
    {
      id: 1,
      name: "Para Maria Luiza",
      occasion: "Aniversário de 15 Anos",
      status: "ready" as const,
      statusLabel: "Pronto para entrega",
      statusIcon: "celebration",
      link: "qrmagico.com/p/maria-15",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuO1XpSgXjHB-POXG3mOBsLrVOFceLBmhuDZWxfheIKosrpavu9DqojUB-h1LEqQurefFAcII9kmcbly_R9bon8uwagjBvqwsYndPXKG6I2LfFwev2EvHrOPcPmU_dj_MwevFGTzlmIx9GfwOVGBBUMPIVQw_LvEUzg3olaby7KOw1hjQ-Ogw3iKroiBNP7836o55W-xNO6_FOD63qTJ61o-RNvAqzZFwzWlJGSdRduLnvW7LiR34TqgtBPhtmO4lF10pcSrZUUQQ",
    },
    {
      id: 2,
      name: "Para Papai",
      occasion: "Dia dos Pais",
      status: "generating" as const,
      statusLabel: "Gerando trilha sonora",
      statusIcon: "sync",
      description: "Estamos selecionando as melhores melodias para combinar com suas fotos...",
    },
    {
      id: 3,
      name: "Surpresa de Casamento",
      occasion: "Casamento Amanda & Caio",
      status: "payment" as const,
      statusLabel: "Aguardando pagamento",
      statusIcon: "hourglass_empty",
    },
  ];

  const faqs = [
    "Posso alterar as fotos depois?",
    "Quanto tempo o link dura?",
    "O QR Code para de funcionar?",
  ];

  const handleCopy = (id: number, link: string) => {
    navigator.clipboard?.writeText(link);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-background min-h-screen">
      <Header
        showNav
        rightContent={
          <div className="flex items-center gap-4">
            <button className="hidden md:flex bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-90 transition-all scale-95 active:scale-90 shadow-md">
              Create Gift
            </button>
            <div className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-white shadow-sm flex items-center justify-center text-primary font-bold">
              RL
            </div>
          </div>
        }
      />

      <main className="pt-24 pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <header className="mb-12">
          <h1 className="font-headline-md text-headline-md-mobile md:text-headline-md text-on-surface mb-2">Meus Presentes Mágicos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Gerencie suas memórias e acompanhe a mágica acontecendo.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-gutter-desktop">
          <div className="flex-1 space-y-6">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className={cn(
                  "glass-card p-6 rounded-xl flex flex-col md:flex-row gap-6 hover:shadow-lg transition-all duration-300",
                  gift.status === "ready" && "border-l-4 border-l-primary",
                  gift.status === "payment" && "grayscale"
                )}
              >
                {gift.status === "ready" && (
                  <div className="relative w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-warm-gray">
                    <img className="w-full h-full object-cover" src={gift.image} alt="" />
                    <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-primary tracking-wider uppercase">Premium</div>
                  </div>
                )}

                {gift.status === "generating" && (
                  <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-warm-gray flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-[48px] text-outline-variant">auto_awesome</span>
                    <div className="absolute inset-0 shimmer-overlay" />
                  </div>
                )}

                {gift.status === "payment" && (
                  <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-[40px] text-outline">shopping_bag</span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div>
                      <h3 className="font-title-lg text-title-lg text-on-surface">{gift.name}</h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{gift.occasion}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm",
                        gift.status === "ready" && "bg-secondary-container text-on-secondary-container",
                        gift.status === "generating" && "bg-gold-glimmer text-secondary",
                        gift.status === "payment" && "bg-surface-variant text-on-surface-variant"
                      )}
                    >
                      <span className={cn("material-symbols-outlined text-[16px]", gift.status === "generating" && "animate-spin")}>
                        {gift.statusIcon}
                      </span>
                      {gift.statusLabel}
                    </span>
                  </div>

                  {gift.status === "ready" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 bg-warm-gray/30 rounded-lg border border-outline-variant/30">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Link do Presente</span>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-mono text-primary truncate">{gift.link}</code>
                          <button
                            className="p-1 hover:bg-white rounded transition-colors"
                            title="Copiar Link"
                            onClick={() => handleCopy(gift.id, gift.link!)}
                          >
                            <span className={cn("material-symbols-outlined text-primary text-[18px]", copiedIndex === gift.id && "text-green-600")}>
                              {copiedIndex === gift.id ? "check" : "content_copy"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-coral-deep transition-all flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                          Baixar PDF
                        </button>
                        <button className="w-10 h-10 border border-outline flex items-center justify-center rounded-lg hover:bg-white transition-all text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {gift.status === "generating" && (
                    <>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-2 italic">{gift.description}</p>
                      <div className="flex gap-4 mt-6">
                        <button className="font-label-md text-label-md text-primary border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all">Ver Visualização</button>
                        <button className="font-label-md text-label-md text-on-surface-variant px-4 py-2 rounded-lg hover:bg-warm-gray transition-all">Cancelar</button>
                      </div>
                    </>
                  )}

                  {gift.status === "payment" && (
                    <div className="flex gap-4 mt-6">
                      <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:bg-coral-deep transition-all">Finalizar Pagamento</button>
                      <button className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-primary-fixed p-6 rounded-xl relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h4 className="font-title-lg text-title-lg text-on-primary-fixed mb-4">Como funciona a entrega?</h4>
                <div className="space-y-4">
                  {[
                    "Baixe o PDF com o design exclusivo.",
                    "Imprima ou envie o QR Code para a pessoa.",
                    "Ela escaneia e a mágica acontece!",
                  ].map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-on-primary-fixed-variant">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-primary/10 rotate-12 pointer-events-none">redeem</span>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-widest border-b border-outline-variant/30 pb-3 mb-4">Dúvidas Frequentes</h4>
              <ul className="space-y-4">
                {faqs.map((faq, i) => (
                  <li key={i}>
                    <button
                      className="w-full text-left flex justify-between items-center group"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    >
                      <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">{faq}</span>
                      <span className={cn("material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-transform", faqOpen === i && "rotate-90")}>
                        chevron_right
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <a className="inline-block mt-6 text-sm font-bold text-primary hover:underline decoration-2 underline-offset-4" href="#">Ver Central de Suporte</a>
            </div>
          </aside>
        </div>
      </main>

      <button className="fixed bottom-8 right-8 md:bottom-12 md:right-12 bg-primary text-on-primary px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 scale-100 hover:scale-105 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <span className="font-label-md text-label-md">Criar Novo Presente</span>
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity shimmer-overlay" />
      </button>

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
