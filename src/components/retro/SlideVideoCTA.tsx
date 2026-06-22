import { useState, useCallback } from "react";
import { useStoryViewer } from "./StoryViewerContext";

interface SlideVideoCTAProps {
  slideIndex: number;
  videoUrl: string;
  thumbnail?: string;
}

export function SlideVideoCTA({ slideIndex, videoUrl, thumbnail }: SlideVideoCTAProps) {
  const { presente } = useStoryViewer();
  const [showPlayer, setShowPlayer] = useState(false);

  const handleContinue = useCallback(() => {
    const container = document.querySelector("[data-scroll-container]");
    if (!container) return;
    const next = container.querySelector(`[data-slide-index="${slideIndex + 1}"]`) as HTMLElement;
    if (next) {
      next.scrollIntoView({ behavior: "smooth" });
    }
  }, [slideIndex]);

  if (showPlayer) {
    return (
      <div className="relative w-full h-full bg-black flex flex-col">
        <video
          src={videoUrl}
          className="flex-1 w-full object-contain"
          controls
          autoPlay
          playsInline
          poster={thumbnail}
        />
        <div className="p-4 flex justify-center bg-black/80">
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-full font-label-md text-label-md text-white bg-primary hover:brightness-110 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">
      {thumbnail && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </>
      )}

      <div className="relative z-10 text-center px-6">
        <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-3">
          Reviva este momento
        </p>
        <h2
          className="text-white font-bold mb-8"
          style={{
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          Assista ao vídeo
        </h2>

        <button
          onClick={() => setShowPlayer(true)}
          className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6 hover:bg-white/30 hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-white text-5xl">
            play_arrow
          </span>
        </button>

        <p className="text-white/50 text-sm font-body-md">
          Uma homenagem em vídeo para {presente.nome_homenageado}
        </p>
      </div>
    </div>
  );
}
