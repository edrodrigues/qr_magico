import { useEffect, useRef, useCallback, useMemo, useState } from "react";
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
    currentIndex, isPaused, isMuted,
    goNext, goPrev, pause, resume, toggleMute,
  } = useStoryViewer();

  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const [progressValues, setProgressValues] = useState<number[]>(() => slides.map(() => 0));

  const currentSlide = slides[currentIndex];
  const isManual = currentSlide?.isManual ?? false;
  const duration = currentSlide?.duration ?? 5000;

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
    if (isManual || isPaused) return;

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
  }, [slides]);

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
      },
      onDrag: ({ movement: [mx], distance }) => {
        if (distance[0] < 50) return;
        if (mx < -30) goNext();
        if (mx > 30) goPrev();
      },
      onPointerDown: () => pause(),
      onPointerUp: () => resume(),
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

  const slideVariants = useMemo(() => ({
    initial: { opacity: 0, x: 100, scale: reducedMotion ? 1 : 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -100, scale: reducedMotion ? 1 : 0.95 },
  }), [reducedMotion]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" {...bind()}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-2 pt-2">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              style={{
                scaleX: i < currentIndex ? 1 : i === currentIndex ? progressValues[i] : 0,
                transformOrigin: "left",
              }}
            />
          </div>
        ))}
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white text-sm"
        aria-label={isMuted ? "Ativar som" : "Desativar som"}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isMuted ? "volume_off" : "volume_up"}
        </span>
      </button>

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

      {/* Navigation hints */}
      {currentIndex > 0 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-white text-[16px]">chevron_left</span>
        </div>
      )}
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
