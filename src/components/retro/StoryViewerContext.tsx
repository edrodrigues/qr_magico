import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { PresenteData, FotoData, MusicaData } from "../../types/retro";

interface StoryViewerContextType {
  isMuted: boolean;
  toggleMute: () => void;
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
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
}

export function StoryViewerProvider({
  children,
  presente,
  fotos,
  musica,
}: StoryViewerProviderProps) {
  const [isMuted, setIsMuted] = useState(false);
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted, audioRef]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <StoryViewerContext.Provider
      value={{
        isMuted,
        toggleMute,
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
