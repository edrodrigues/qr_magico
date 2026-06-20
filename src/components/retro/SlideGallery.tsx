import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";

export function SlideGallery() {
  const { fotos, presente } = useStoryViewer();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = fotos.length > 0
    ? [...fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.url)
    : presente.thumbnail_url
      ? [presente.thumbnail_url]
      : [];

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-surface to-surface-container flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">photo_library</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Memórias em breve</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={photoIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, rotateY: -5, scale: 1.1 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, rotateY: 5, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        >
          <img
            src={photos[photoIndex]}
            alt=""
            className="w-full h-full object-cover"
            style={{
              animation: "kenBurns 10s ease-in-out infinite alternate",
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-4 py-1.5 rounded-full">
        <span className="text-white/80 text-sm font-medium">
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
