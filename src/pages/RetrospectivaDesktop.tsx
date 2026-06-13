import { useState, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { Header, Footer } from "../components/Header";

const slides = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDnkvVg4xZlhyIM23h68A3tGd5PnpWtVbN3ZdwMVxYhl3vlL2M3aLcAsU1ab2dNr9mx7O1yaiHF1lJKihAPyatBZvU4Us3saCN4_rjU7LWVDcpRopqyB-CulJ_830Fphcn05gWuO5C00kLbrLKxbQz7oXY-vAYBuI3Ylfmy_sTj85vaK0bpmWpSCNt1DMVqAeei6OOyNqky5O_VX5df8RgqJJcW2lhZL5V1bdWhjDjwgpInX7tBgr_wRM78krmHqUMasE_sfb5qIIQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4wvEfz3uyLAaFRxu0YPhl7QHhhmwvBncd45lq6VHid3YTYsR9taXcRvSqTowXMH2kMD_-5kA5yHoJIQjTQZVvw3pP3b07_Y3KrwRZlKsRUG_QdUhbhKsrILtUyJNb0PH3PLzIwPphnCw-7gxkX1scJmLSmuCh4Tjd0326wkeg-nPKNT4HlkGk3zCE1zFfkm9XbgEwl3PxSLIIrML7rNUPWVMOvV3rm5Bt-GkXTsTm-A4Ibc4SuJR5AJ8M7I1HfH3_aXSSse8iKRw",
];

export function RetrospectivaDesktop() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(33);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="bg-soft-cream min-h-screen">
      <Header
        showNav
        rightContent={
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform"
            onClick={() => setQrOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            <span>Ver QR Code</span>
          </button>
        }
      />

      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">Para Alguém Especial</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant italic max-w-2xl mx-auto">
            &ldquo;Onde há amor, há magia. Que estes momentos guardem a essência de tudo o que vivemos.&rdquo;
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl bg-warm-gray aspect-[4/5] md:aspect-video">
              <div className="relative w-full h-full">
                {slides.map((src, index) => (
                  <div
                    key={index}
                    className="absolute inset-0 transition-all duration-800 ease-in-out"
                    style={{
                      opacity: index === currentSlide ? 1 : 0,
                      transform: index === currentSlide ? "scale(1)" : "scale(1.1)",
                      transitionDuration: "0.8s",
                      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <img className="w-full h-full object-cover" src={src} alt="" />
                  </div>
                ))}
              </div>

              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-panel text-primary hover:bg-white/60 transition-all opacity-0 group-hover:opacity-100"
                onClick={prevSlide}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass-panel text-primary hover:bg-white/60 transition-all opacity-0 group-hover:opacity-100"
                onClick={nextSlide}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: index === currentSlide ? "32px" : "16px",
                      backgroundColor: index === currentSlide ? "white" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-lg border border-white/50">
              <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApsHcf0MgC0lQdcLRk0CbW4SdzT-gb9kCyGitNyakuTDn_84pu1KMPCFgrfjSH4Ewgh8xM5dDx-0UUmVYNHKa2c5I-9Ppq49-1wAk_5_vtYrc-qr2abQfedJ-mbZ1A52FRurVSt9E9_SdHiNqnZisizz1Lm9zVYJx13g8vlDggGkk6Xvpk9Yv1j7k8DJVHAeu_1i0hTg7hPaoQJ7LLfU90o5SVeVZ6IDOVcRy6D4-uDsEJ0iA6Yl9JWMCSF69QPXh7YoaVDgtjjyg"
                  alt=""
                />
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="flex gap-1 items-end h-8">
                    {[0.1, 0.3, 0.2, 0.4].map((delay, i) => (
                      <div
                        key={i}
                        className="waveform-bar w-1 bg-white rounded-full"
                        style={{
                          animationDelay: `${delay}s`,
                          animationPlayState: isPlaying ? "running" : "paused",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-grow w-full space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h3 className="font-title-lg text-title-lg text-primary">Nossa Melodia</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">AI Generated &bull; Acoustic Soul</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-12 h-12 flex items-center justify-center bg-primary text-on-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <span className="material-symbols-outlined text-[28px]">{isPlaying ? "pause" : "play_arrow"}</span>
                    </button>
                    <button
                      className="text-on-surface-variant hover:text-primary transition-colors"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      <span className="material-symbols-outlined">{isMuted ? "volume_off" : "volume_up"}</span>
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <div className="h-1.5 w-full bg-warm-gray rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <input
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>01:12</span>
                  <span>03:45</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[32px] mb-4">auto_awesome</span>
              <h2 className="font-title-lg text-title-lg text-on-surface mb-4">A Nossa História</h2>
              <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-4">
                <p>Cada quilômetro percorrido, cada risada compartilhada e até os silêncios confortáveis moldaram quem somos hoje.</p>
                <p>Este presente é um pequeno portal para tudo o que construímos. Obrigado por fazer parte da minha jornada de forma tão mágica.</p>
              </div>
              <div className="mt-8 pt-8 border-t border-outline-variant/20">
                <p className="font-title-lg text-primary italic">&mdash; Com todo meu afeto.</p>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-gradient-to-br from-coral-light to-gold-glimmer py-4 rounded-full font-label-md text-label-md text-on-primary-container shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined">picture_as_pdf</span>
                BAIXAR CARTÃO PARA IMPRESSÃO
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 bg-white border border-outline-variant/50 rounded-2xl hover:bg-warm-gray transition-colors">
                  <img
                    className="w-6 h-6"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1FdTbb-HxfkVi_dpbYtI4fcoakBAOxeSTe6QDPifHb1n1Z1v6BYTz4vZMCOQQOpxvucnTESBR1B2M8yaW1fShyuebp73IbPvBKDhosLAn4BtkZZR2OlDLh04suL6aBrpWAymSTvmONUkI5VliqrO3nJ2cO9SmrNCv6kHF_EjhRWZcfSSWfOMpa1A381NDKMj_psfaK2-yFpuDCnLbfJIwdj2ES6xlywkrs4oYDeECx1uIVoVtKGhuj2jzIF45trfdVHGwknRoXAA"
                    alt="WhatsApp"
                  />
                  <span className="font-label-md text-label-md">Enviar</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-white border border-outline-variant/50 rounded-2xl hover:bg-warm-gray transition-colors">
                  <img
                    className="w-6 h-6"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDw2Jdq35WB0V-VOzdPcER4EjdI-Q_0dDO6Jnj4XsIaK38ulbnlPgGhIV7e_wK8y3YAHM4CyIxl52ykoDAkICV0O-eT1tCST8vono8pP2PLKCyNnsqXQdhFCLKPAAbP_dB9NzPc-cg4TgNLkUzjIb33XIujrsyPkt97GeoHbFnegVQVKuU_zcjnZdEL6LYv3hyanjJFjDw-6gmaOLUOYtHedrEFbFhmj6h_jjSb6Ri8fjxClanKfvLyMf6cyHWUhYTkU1csf4lwStE"
                    alt="Instagram"
                  />
                  <span className="font-label-md text-label-md">Status</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-6 text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">VOCÊ TAMBÉM PODE CRIAR UM</p>
              <p className="font-body-md text-body-md font-semibold mb-4">Transforme suas fotos em memórias mágicas.</p>
              <a className="text-primary font-label-md text-label-md underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all" href="/">Começar agora</a>
            </div>
          </div>
        </div>
      </main>

      {qrOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-margin-mobile"
          onClick={() => setQrOpen(false)}
        >
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-warm-gray transition-colors"
              onClick={() => setQrOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-full aspect-square bg-warm-gray rounded-3xl p-6 mb-6 flex items-center justify-center border-4 border-gold-glimmer">
              <div className="relative w-full h-full bg-white rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full opacity-80">
                  {[
                    [1,1,0,1,1],
                    [1,0,1,0,1],
                    [0,1,1,1,0],
                    [1,0,1,0,1],
                    [1,1,0,1,1],
                  ].flat().map((v, i) => (
                    <div key={i} className={cn(v ? "bg-primary rounded-sm" : "")} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">favorite</span>
                  </div>
                </div>
              </div>
            </div>
            <h4 className="font-title-lg text-title-lg text-on-surface mb-2">Seu Portal Mágico</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">Aponte a câmera para acessar esta retrospectiva em qualquer lugar.</p>
            <button className="w-full py-4 border-2 border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary hover:text-white transition-all">
              Compartilhar Link
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
