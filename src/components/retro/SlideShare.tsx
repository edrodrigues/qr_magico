import { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";

interface SlideShareProps {
  isActive?: boolean;
}

const LOGO_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="80" height="80">
    <defs>
      <linearGradient id="coral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8E8E" />
        <stop offset="100%" stopColor="#a93539" />
      </linearGradient>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fed65b" />
        <stop offset="100%" stopColor="#735c00" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#fff" />
    <rect x="8" y="8" width="16" height="16" rx="4" fill="url(#coral-grad)" />
    <rect x="12" y="12" width="8" height="8" rx="2" fill="#fff" />
    <rect x="14" y="14" width="4" height="4" rx="1" fill="url(#coral-grad)" />
    <rect x="8" y="40" width="16" height="16" rx="4" fill="url(#coral-grad)" />
    <rect x="12" y="44" width="8" height="8" rx="2" fill="#fff" />
    <rect x="14" y="46" width="4" height="4" rx="1" fill="url(#coral-grad)" />
    <rect x="40" y="8" width="16" height="16" rx="4" fill="url(#coral-grad)" />
    <rect x="44" y="12" width="8" height="8" rx="2" fill="#fff" />
    <path d="M 48 19.5 C 46 17.5 44 15.5 44 13.5 A 2 2 0 0 1 48 11.5 A 2 2 0 0 1 52 11.5 C 52 15.5 50 17.5 48 19.5 Z" fill="url(#gold-grad)" />
    <path d="M 34 39 C 31 36 28 33 28 30 A 3 3 0 0 1 34 27 A 3 3 0 0 1 40 27 C 40 33 37 36 34 39 Z" fill="url(#gold-grad)" />
    <rect x="28" y="12" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="32" y="16" width="4" height="4" rx="1.5" fill="url(#gold-grad)" />
    <rect x="12" y="28" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="24" y="24" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="36" y="24" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="40" y="24" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="48" y="28" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="44" y="32" width="4" height="4" rx="1.5" fill="url(#gold-grad)" />
    <rect x="24" y="44" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="28" y="44" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="40" y="44" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
    <rect x="44" y="40" width="4" height="4" rx="1.5" fill="url(#gold-grad)" />
    <rect x="36" y="48" width="4" height="4" rx="1.5" fill="url(#coral-grad)" />
  </svg>
);

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

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

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
      {/* Top section — logo branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {LOGO_SVG}
        </motion.div>

        <motion.h2
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 text-3xl font-bold tracking-[0.15em] uppercase"
          style={{ fontFamily: "var(--font-display, serif)", color: "var(--color-on-surface)" }}
        >
          Momento Mágico
        </motion.h2>

        <motion.p
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 font-body-md text-body-md text-on-surface-variant tracking-wider"
        >
          Crie memórias que brilham
        </motion.p>

        <motion.div
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="font-title-lg text-title-lg text-on-surface">
            {presente.nome_homenageado}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {presente.ocasiao}
          </p>
        </motion.div>
      </div>

      {/* Bottom section — actions */}
      <div className="px-8 pb-10 flex flex-col items-center gap-3 w-full">
        <motion.button
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          onClick={handleShare}
          className="w-full max-w-xs py-3 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          Compartilhar
        </motion.button>

        <motion.button
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          onClick={handleCopyLink}
          className="w-full max-w-xs py-3 border border-outline-variant text-on-surface rounded-full font-label-md text-label-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
          Copiar Link
        </motion.button>

        <motion.p
          animate={isActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-4 font-label-sm text-label-sm text-on-surface-variant"
        >
          Crie a sua própria retrospectiva em{" "}
          <a href={appUrl} className="text-primary underline">Momento Mágico</a>
        </motion.p>
      </div>
    </div>
  );
}