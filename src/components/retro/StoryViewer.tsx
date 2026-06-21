import { useEffect, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { StoryViewerProvider, useStoryViewer } from "./StoryViewerContext";
import type { SlideConfig } from "../../types/retro";
import type { PresenteData, FotoData, MusicaData } from "../../types/retro";

interface StoryViewerProps {
  slides: SlideConfig[];
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
  renderSlide: (slide: SlideConfig, index: number) => React.ReactNode;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function StoryViewerInner({ slides, renderSlide }: {
  slides: SlideConfig[];
  renderSlide: (slide: SlideConfig, index: number) => React.ReactNode;
}) {
  const {
    currentIndex, isMuted, needsInteraction, setNeedsInteraction,
    goNext, goPrev, toggleMute,
    audioRef, analyserRef, initAudioAnalyser, musica,
  } = useStoryViewer();

  const reducedMotion = useReducedMotion();

  const tapZone = useCallback((clientX: number, width: number) => {
    const ratio = clientX / width;
    if (ratio < 0.3) goPrev();
    else if (ratio > 0.7) goNext();
  }, [goNext, goPrev]);

  const bind = useGesture(
    {
      onClick: ({ event }) => {
        const target = event.currentTarget as HTMLElement;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        tapZone(event.clientX, rect.width);

        if (!analyserRef.current && audioRef.current) {
          initAudioAnalyser();
        }
      },
      onDrag: ({ movement: [mx], distance }) => {
        if (distance[0] < 50) return;
        if (mx < -30) goNext();
        if (mx > 30) goPrev();
      },
    },
    { drag: { axis: "x", filterTaps: true } }
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, audioRef]);

  const slideVariants = useMemo(() => ({
    initial: { opacity: 0, x: 100, scale: reducedMotion ? 1 : 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -100, scale: reducedMotion ? 1 : 0.95 },
  }), [reducedMotion]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" {...bind()}>
      {/* Progress dots */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-2 pt-2">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: i <= currentIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)" }}
          />
        ))}
      </div>

      {/* Mute button */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white text-sm"
        aria-label={isMuted ? "Ativar som" : "Desativar som"}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isMuted ? "volume_off" : "volume_up"}
        </span>
      </button>

      {/* Background audio */}
      <audio ref={audioRef} loop preload="auto" autoPlay />

      {/* Tap to start overlay */}
      {needsInteraction && currentIndex === 0 && musica?.url_audio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            e.stopPropagation();
            initAudioAnalyser();
            audioRef.current?.play().catch(() => {});
            setNeedsInteraction(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-4 px-8 py-10 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <span className="material-symbols-outlined text-white text-4xl">music_note</span>
            </div>
            <p className="text-white text-lg font-medium text-center leading-relaxed">
              Toque para ouvir a música
            </p>
            <span className="text-white/50 text-sm">Toque em qualquer lugar</span>
          </motion.div>
        </motion.div>
      )}

      {/* Slides */}
      <AnimatePresence mode="wait" custom={currentIndex}>
        <motion.div
          key={slides[currentIndex]?.id ?? currentIndex}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
          className="absolute inset-0"
        >
          {renderSlide(slides[currentIndex], currentIndex)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function StoryViewer(props: StoryViewerProps) {
  const { slides, presente, fotos, musica, renderSlide } = props;

  return (
    <StoryViewerProvider
      totalSlides={slides.length}
      presente={presente}
      fotos={fotos}
      musica={musica}
    >
      <StoryViewerInner slides={slides} renderSlide={renderSlide} />
    </StoryViewerProvider>
  );
}
