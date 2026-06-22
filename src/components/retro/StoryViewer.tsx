import { useEffect, useCallback, useMemo, useState, useRef } from "react";
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
    currentIndex, isMuted, isPaused,
    goNext, goPrev, toggleMute, pause, resume,
    audioRef, analyserRef, initAudioAnalyser,
  } = useStoryViewer();

  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const [progressValues, setProgressValues] = useState<number[]>(() => slides.map(() => 0));

  const currentSlide = slides[currentIndex];
  const duration = currentSlide?.duration ?? 0;
  const isManual = currentSlide?.isManual ?? false;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateProgress = useCallback((index: number, value: number) => {
    setProgressValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  useEffect(() => {
    if (isManual || isPaused || duration <= 0) return;
    const startTime = Date.now();
    const interval = 50;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      progressRef.current = pct;
      updateProgress(currentIndex, pct);
      if (pct >= 1) {
        goNext();
      } else {
        timerRef.current = setTimeout(tick, interval);
      }
    };
    timerRef.current = setTimeout(tick, interval);
    return clearTimer;
  }, [currentIndex, duration, isManual, isPaused, goNext, clearTimer, updateProgress]);

  useEffect(() => {
    setProgressValues(slides.map(() => 0));
    progressRef.current = 0;
  }, [slides]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resume);
    return () => {
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resume);
    };
  }, [pause, resume]);

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

        if (audioRef.current?.paused) {
          audioRef.current.play().catch(() => {});
        }
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
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none" {...bind()}>
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-2 pt-2">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
          >
            <div
              className="h-full bg-white rounded-full transition-transform duration-75"
              style={{
                transform: `scaleX(${i < currentIndex ? 1 : i === currentIndex ? progressValues[i] : 0})`,
                transformOrigin: "left",
              }}
            />
          </div>
        ))}
      </div>

      {/* Mute button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
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
