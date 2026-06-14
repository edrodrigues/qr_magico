import { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { SlideWrapper } from "./SlideWrapper";
import type { ConfettiOptions } from "canvas-confetti";

async function triggerConfetti(reducedMotion: boolean) {
  if (reducedMotion) return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    const defaults: ConfettiOptions = {
      spread: 60,
      ticks: 60,
      startVelocity: 20,
      colors: ["#a93539", "#f26b6b", "#fed65b", "#ffdad8"],
      origin: { y: 0.6 },
    };
    confetti({ ...defaults, particleCount: 40, angle: 60 });
    confetti({ ...defaults, particleCount: 40, angle: 120 });
  } catch {
    // confetti not available
  }
}

export function SlideShare() {
  const { presente, fotos } = useStoryViewer();
  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      triggerConfetti(reducedMotion);
    }
  }, [reducedMotion]);

  const photoUrl = fotos.length > 0 ? fotos[0].url : presente.thumbnail_url;
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `QR Mágico — Para ${presente.nome_homenageado}`,
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
    <div className="w-full h-full bg-gradient-to-b from-surface-container to-surface">
      <SlideWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl mb-6 w-full max-w-xs"
        >
          {photoUrl && (
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-primary/20">
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h3 className="font-title-lg text-title-lg text-on-surface mb-1">
            {presente.nome_homenageado}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-3">
            {presente.ocasiao}
          </p>
          <div className="flex items-center justify-center gap-1 text-primary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span className="truncate max-w-[200px]">{window.location.href}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={handleShare}
            className="w-full py-3 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Compartilhar
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 border border-outline-variant text-on-surface rounded-full font-label-md text-label-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
            Copiar Link
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 font-label-sm text-label-sm text-on-surface-variant"
        >
          Crie a sua própria retrospectiva em{" "}
          <a href={appUrl} className="text-primary underline">QR Mágico</a>
        </motion.p>
      </SlideWrapper>
    </div>
  );
}
