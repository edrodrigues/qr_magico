import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";

interface MusicRevealProps {
  onReady?: () => void;
}

export function MusicReveal({ onReady }: MusicRevealProps) {
  const { musica, isMuted } = useStoryViewer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const audioUrl = musica?.url_audio;

  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || analyserRef.current) return;
    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // AudioContext may fail in some environments
    }
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration);
      setAudioLoaded(true);
      onReady?.();
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => setIsPlaying(false);

    audio.loop = true;
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, onReady]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioLoaded) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!sourceRef.current) setupAudioContext();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioLoaded, setupAudioContext]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Visualizer loop
  useEffect(() => {
    if (!isPlaying || !analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(169, 53, 57, ${0.3 + (dataArray[i] / 255) * 0.7})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  if (!audioUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-surface to-surface-container flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">music_note</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Música sendo preparada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-surface-container to-surface flex flex-col items-center justify-center px-6">
      {/* Artwork with glow */}
      <motion.div
        className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl mb-6"
        animate={isPlaying ? { boxShadow: "0 0 60px rgba(169,53,57,0.4), 0 0 120px rgba(169,53,57,0.2)" } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-gold-glimmer/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary/40">music_note</span>
        </div>
      </motion.div>

      {/* Waveform visualizer */}
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full max-w-xs h-15 rounded-lg mb-4"
      />

      {/* Play button + time */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          <span className="material-symbols-outlined text-3xl">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>
        <div className="text-left">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>

      {/* Download */}
      {audioUrl && (
        <a
          href={audioUrl}
          download
          className="mt-4 text-primary font-label-md text-label-md flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download MP3
        </a>
      )}
    </div>
  );
}
