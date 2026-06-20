import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBlobBackground } from "./AnimatedBlobBackground";

const PHRASES = [
  "Estamos preparando sua surpresa...",
  "Compondo a música perfeita...",
  "Renderizando o vídeo especial...",
  "Organizando as memórias...",
  "Quase pronto...",
];

interface LoadingStateProps {
  onReady?: () => void;
  status: string;
}

export function LoadingState({ onReady, status }: LoadingStateProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === "ready") {
      onReady?.();
    }
  }, [status, onReady]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-surface to-surface-container overflow-hidden">
      <AnimatedBlobBackground />

      <div className="relative z-10 text-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
              auto_awesome
            </span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="font-body-lg text-body-lg text-on-surface-variant"
          >
            {PHRASES[phraseIndex]}
          </motion.p>
        </AnimatePresence>

        <motion.div className="flex gap-2 justify-center mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
