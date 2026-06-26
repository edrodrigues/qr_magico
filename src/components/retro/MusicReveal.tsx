import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";

interface MusicRevealProps {
  isActive?: boolean;
}

export function MusicReveal({ isActive }: MusicRevealProps) {
  const { musica, analyserRef, initAudioAnalyser } = useStoryViewer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const audioUrl = musica?.url_audio;

  useEffect(() => {
    if (isActive && !analyserRef.current) {
      initAudioAnalyser();
    }
  }, [isActive, analyserRef, initAudioAnalyser]);

  // Visualizer loop from shared analyser
  useEffect(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
  }, [analyserRef]);

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
      <motion.div
        className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl mb-6"
        animate={isActive ? { boxShadow: "0 0 60px rgba(169,53,57,0.4), 0 0 120px rgba(169,53,57,0.2)" } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-gold-glimmer/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary/40">music_note</span>
        </div>
      </motion.div>

      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full max-w-xs h-15 rounded-lg mb-4"
      />

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
