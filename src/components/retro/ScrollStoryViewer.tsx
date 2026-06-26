import { useEffect, useRef, useState, useCallback } from "react";
import { StoryViewerProvider, useStoryViewer } from "./StoryViewerContext";
import { ScrollProgress } from "./ScrollProgress";
import type { SlideConfig } from "../../types/retro";
import type { PresenteData, FotoData, MusicaData } from "../../types/retro";

interface ScrollStoryViewerProps {
  slides: SlideConfig[];
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
  renderSlide: (slide: SlideConfig, index: number, isActive: boolean) => React.ReactNode;
}

function ScrollStoryViewerInner({ slides, renderSlide }: {
  slides: SlideConfig[];
  renderSlide: (slide: SlideConfig, index: number, isActive: boolean) => React.ReactNode;
}) {
  const { audioRef, initAudioAnalyser } = useStoryViewer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSlide = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const slide = container.querySelector(`[data-slide-index="${index}"]`) as HTMLElement | null;
    if (slide) {
      isScrollingRef.current = true;
      slide.scrollIntoView({ behavior: "smooth" });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 600);
    }
  }, []);

  const scrollNext = useCallback(() => {
    const next = activeIndex + 1;
    if (next < slides.length) {
      scrollToSlide(next);
    }
  }, [activeIndex, slides.length, scrollToSlide]);

  // Track active slide via scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slideHeight = container.clientHeight;
      const index = Math.round(container.scrollTop / slideHeight);
      setActiveIndex((prev) => {
        const clamped = Math.min(index, slides.length - 1);
        if (clamped !== prev && !isScrollingRef.current) {
          if (clamped > prev) {
            const audio = audioRef.current;
            if (audio && !initAudioAnalyser) {
              // Init audio context on user interaction
            }
          }
        }
        return clamped;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [slides.length, audioRef, initAudioAnalyser]);

  // Auto-advance timer
  useEffect(() => {
    const slide = slides[activeIndex];
    if (!slide || slide.isManual || !slide.duration) return;

    autoTimerRef.current = setTimeout(() => {
      scrollNext();
    }, slide.duration);

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [activeIndex, slides, scrollNext]);

  // Init audio analyser when music-reveal slide becomes active
  useEffect(() => {
    const slide = slides[activeIndex];
    if (slide?.id === "music-reveal" && audioRef.current) {
      initAudioAnalyser();
    }
  }, [activeIndex, slides, audioRef, initAudioAnalyser]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = activeIndex - 1;
        if (prev >= 0) scrollToSlide(prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, scrollNext, scrollToSlide]);

  return (
      <div className="relative w-full h-full overflow-hidden">
      {/* Background audio */}
      <audio ref={audioRef} loop preload="auto" />

      {/* Scrollable slides */}
      <div
        ref={containerRef}
        data-scroll-container
        className="h-full w-full snap-y-mandatory"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            data-slide-index={i}
            data-slide-id={slide.id}
            className="h-dvh w-full shrink-0 snap-start"
          >
            {renderSlide(slide, i, i === activeIndex)}
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <ScrollProgress
        slides={slides}
        active={activeIndex}
        onDotClick={scrollToSlide}
      />
    </div>
  );
}

export function ScrollStoryViewer(props: ScrollStoryViewerProps) {
  const { slides, presente, fotos, musica, renderSlide } = props;

  return (
    <StoryViewerProvider
      presente={presente}
      fotos={fotos}
      musica={musica}
    >
      <ScrollStoryViewerInner slides={slides} renderSlide={renderSlide} />
    </StoryViewerProvider>
  );
}
