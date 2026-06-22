import { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";

interface SlideShareProps {
  isActive?: boolean;
}

async function triggerConfetti(reducedMotion: boolean) {
  if (reducedMotion) return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    const defaults: confetti.Options = {
      spread: 60,
      ticks: 60,
      startVelocity: 20,
      colors: ["#C96442", "#F7EAE6", "#6C6B69", "#CFCFCD"],
      origin: { y: 0.6 },
    };
    confetti({ ...defaults, particleCount: 40, angle: 60 });
    confetti({ ...defaults, particleCount: 40, angle: 120 });
  } catch {
    // confetti not available
  }
}

export function SlideShare({ isActive }: SlideShareProps) {
  const { presente } = useStoryViewer();
  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const confettiFired = useRef(false);

  useEffect(() => {
    if (isActive && !confettiFired.current) {
      confettiFired.current = true;
      triggerConfetti(reducedMotion);
    }
  }, [isActive, reducedMotion]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `Momento Mágico — Para ${presente.nome_homenageado}`,
      text: `Uma retrospectiva especial para ${presente.nome_homenageado}`,
      url: window.location.href,
    };

    if (navigator.share && window.innerWidth < 768) {
      try { await navigator.share(shareData); return; } catch {}
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text}\n${shareData.url}`)}`;
    window.open(whatsappUrl, "_blank");
  }, [presente.nome_homenageado]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
  }, []);

  return (
    <div className="w-full h-dvh bg-gradient-to-b from-surface-container to-surface flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-4xl font-light tracking-wide text-on-surface">
            {presente.nome_homenageado}
          </p>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
            {presente.ocasiao}
          </p>
        </motion.div>
      </div>

      <div className="px-8 pb-14 flex flex-col items-center gap-3 w-full">
        <motion.button
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          onClick={handleShare}
          className="w-full max-w-xs py-3 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          Compartilhar
        </motion.button>

        <motion.button
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          onClick={handleCopyLink}
          className="w-full max-w-xs py-3 border border-outline-variant text-on-surface rounded-full font-label-md text-label-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
          Copiar Link
        </motion.button>

        <motion.p
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-6 font-label-sm text-label-sm text-on-surface-variant"
        >
          Crie memórias que brilham em{" "}
          <a href="https://qrmagico.vercel.app/" className="text-primary underline">Momento Mágico</a>
        </motion.p>
      </div>
    </div>
  );
}