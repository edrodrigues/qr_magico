import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { PresenteData, FotoData, MusicaData } from "../../types/retro";

interface StoryViewerContextType {
  currentIndex: number;
  totalSlides: number;
  isMuted: boolean;
  isPaused: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  toggleMute: () => void;
  pause: () => void;
  resume: () => void;
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  initAudioAnalyser: () => void;
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
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioAnalyser = useCallback(() => {
    if (analyserRef.current || !audioRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // AudioContext may not be available
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && musica?.url_audio) {
      audioRef.current.src = musica.url_audio;
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    }
  }, [musica?.url_audio]);

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
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioRef]);

  return (
    <StoryViewerContext.Provider
      value={{
        currentIndex,
        totalSlides,
        isMuted,
        isPaused,
        goNext,
        goPrev,
        goTo,
        toggleMute,
        pause,
        resume,
        presente,
        fotos,
        musica,
        audioRef,
        analyserRef,
        initAudioAnalyser,
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
