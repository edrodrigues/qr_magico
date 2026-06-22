import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { getOccasionTheme } from "../../remotion/theme";

interface SlideGalleryProps {
  isActive?: boolean;
}

export function SlideGallery({ isActive }: SlideGalleryProps) {
  const { fotos, presente } = useStoryViewer();
  const theme = getOccasionTheme(presente.ocasiao);
  const [photoIndex, setPhotoIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const photos = fotos.length > 0
    ? [...fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.url)
    : presente.thumbnail_url
      ? [presente.thumbnail_url]
      : [];

  useEffect(() => {
    if (!isActive || photos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, photos.length]);

  if (photos.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
        }}
      >
        <svg
          style={{ width: 80, height: 80, marginBottom: 16 }}
          viewBox="0 0 24 24"
          fill={theme.secondary}
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
        <p style={{ color: theme.secondary, fontSize: 24 }}>Memórias em breve</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
          opacity: 0.3,
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={photoIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <img
            src={photos[photoIndex]}
            alt=""
            className="w-full h-full object-cover"
            style={{
              animation: isActive ? "kenBurns 10s ease-in-out infinite alternate" : "none",
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent z-10" />

      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-5 py-2 rounded-full"
        style={{
          backgroundColor: `${theme.primary}99`,
          backdropFilter: "blur(8px)",
        }}
      >
        <span className="text-white/90 text-sm font-medium">
          {photoIndex + 1}/{photos.length}
        </span>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-2%, -1%); }
        }
      `}</style>
    </div>
  );
}
