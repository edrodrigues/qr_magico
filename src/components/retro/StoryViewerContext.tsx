import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { PresenteData, FotoData, MusicaData } from "../../types/retro";

interface StoryViewerContextType {
  currentIndex: number;
  totalSlides: number;
  isPaused: boolean;
  isMuted: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  toggleMute: () => void;
  pause: () => void;
  resume: () => void;
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
}

const StoryViewerContext = createContext<StoryViewerContextType | undefined>(undefined);

interface StoryViewerProviderProps {
  children: ReactNode;
  totalSlides: number;
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
}

export function StoryViewerProvider({
  children,
  totalSlides,
  presente,
  fotos,
  musica,
}: StoryViewerProviderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
  }, [totalSlides]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <StoryViewerContext.Provider
      value={{
        currentIndex,
        totalSlides,
        isPaused,
        isMuted,
        goNext,
        goPrev,
        goTo,
        toggleMute,
        pause,
        resume,
        presente,
        fotos,
        musica,
      }}
    >
      {children}
    </StoryViewerContext.Provider>
  );
}

export function useStoryViewer() {
  const context = useContext(StoryViewerContext);
  if (!context) throw new Error("useStoryViewer must be used within StoryViewerProvider");
  return context;
}
