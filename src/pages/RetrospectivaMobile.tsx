import { useState, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";


export function RetrospectivaMobile() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const h = document.documentElement;
    const b = document.body;
    const percent = ((h.scrollTop || b.scrollTop) / ((h.scrollHeight || b.scrollHeight) - h.clientHeight)) * 100;
    setScrollProgress(Math.min(percent, 100));
    setScrollY(window.pageYOffset);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="overflow-x-hidden bg-background min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-margin-mobile py-6">
        <h1 className="font-headline-md-mobile text-headline-md-mobile font-bold text-primary">QR Mágico</h1>
        <button
          aria-label="Ver QR Code"
          className="w-12 h-12 flex items-center justify-center rounded-full glass-panel text-primary shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">qr_code_2</span>
        </button>
      </header>

      <main className="min-h-screen flex flex-col">
        <section className="relative w-full h-[663px] md:h-[751px] overflow-hidden">
          <div className="absolute inset-0 flex transition-transform duration-700 ease-in-out">
            <div className="min-w-full h-full relative">
              <img
                alt="Memória de Amor"
                className="w-full h-full object-cover photo-mask"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4DiP_d6NfjLPlU6RupLpIYP-CdqrUxgVxMgha1v4vHH0Vslo4Mz0QjyaNr9wtkCheuBYafXgKuM5W1cARUYrF0JFB8-29PMlHfgLZ8jKEbhffNA_1SF-AZ5iJ5hChqxOyGvcjwkhByEzGbw0j40QZ3mV4qp5VH40PDL-YoTYfuqpKm-lGVUAq5jAW7r07L-cS5U7NFy6I4x_B8qywxtXbkO1IDAuN0m2K0REQKBYqglXGZpAQSFdlDOdb7RV07nyASHPSTVxWnNk"
                style={{ transform: `scale(${1 + Math.min(scrollY, 400) / 2000})` }}
              />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />

          <div className="absolute bottom-6 left-margin-mobile right-margin-mobile z-20">
            <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/40">
              <div className="flex items-center gap-4">
                <button
                  className={cn(
                    "w-14 h-14 flex-shrink-0 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform",
                    isPlaying && "animate-pulse"
                  )}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <span className="material-symbols-outlined text-3xl">{isPlaying ? "pause" : "play_arrow"}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-label-md text-label-md text-on-surface truncate">Nossa Música</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">0:45 / 3:20</span>
                  </div>
                  <div className="relative h-1.5 w-full bg-warm-gray rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1/3 bg-primary rounded-full" />
                  </div>
                </div>
                <div className="flex gap-0.5 items-end h-6 w-8 pb-1">
                  {[0.1, 0.3, 0.2, 0.4].map((delay, i) => (
                    <div
                      key={i}
                      className="waveform-bar w-1 bg-primary/40 rounded-full"
                      style={{
                        animationDelay: `${delay}s`,
                        animationPlayState: isPlaying ? "running" : "paused",
                        opacity: i === 2 ? 1 : i === 1 ? 0.6 : i === 0 ? 0.4 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile pt-8 pb-20 flex-grow bg-background">
          <div className="max-w-md mx-auto">
            <div className="mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-outline-variant" />
              <span className="font-label-md text-label-md text-primary tracking-widest">PARA VOCÊ</span>
            </div>
            <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-background mb-6 leading-tight">
              Um presente com<br /><span className="italic text-primary">tecnologia e alma.</span>
            </h2>
            <article className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed space-y-6">
              <p>Cada detalhe deste presente foi pensado para eternizar um momento que as palavras, sozinhas, não conseguem explicar.</p>
              <p>Nesta retrospectiva, as fotos ganham vida com a melodia que marcou nossa história. Que cada batida do coração acompanhe o ritmo dessa lembrança.</p>
            </article>
            <div className="mt-12 space-y-4">
              <button className="w-full py-5 bg-primary text-white rounded-full font-label-md text-label-md flex items-center justify-center gap-2 shadow-lg hover:bg-coral-deep transition-all active:scale-95">
                <span className="material-symbols-outlined">print</span>
                BAIXAR CARTÃO PARA IMPRESSÃO
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-4 border border-outline-variant text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                  COMPARTILHAR
                </button>
                <button className="flex items-center justify-center gap-2 py-4 border border-outline-variant text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                  FAVORITAR
                </button>
              </div>
            </div>
            <div className="mt-16 text-center">
              <p className="font-label-sm text-label-sm text-outline mb-4">&copy; 2024 QR Mágico. Tecnologia com Alma.</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-primary/10 z-50">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <style>{`
        .photo-mask {
          mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
        }
      `}</style>
    </div>
  );
}
