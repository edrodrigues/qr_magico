import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { getPalette } from "../../lib/genrePalettes";
import { SlideWrapper } from "./SlideWrapper";

const STYLE_LABELS: Record<string, string> = {
  mpb: "MPB",
  pop: "Pop",
  piano: "Piano Solo",
  lofi: "Lo-fi",
  sertanejo: "Sertanejo",
};

export function SlideMusicStyle() {
  const { presente } = useStoryViewer();
  const styleLabel = STYLE_LABELS[presente.estilo_musical] || presente.estilo_musical || "Especial";
  const palette = getPalette(presente.estilo_musical);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${palette[0]}15, ${palette[1] ?? palette[0]}10)` }}
    >
      <SlideWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-end gap-1.5 h-16 mb-8"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 rounded-full"
              style={{ backgroundColor: palette[0] }}
              animate={{ height: [8, 32, 16, 40, 20, 48, 12].map((h) => `${h}px`)[i] }}
              transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity, repeatType: "reverse" }}
            />
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-headline-md text-headline-md mb-4"
          style={{ color: palette[0] }}
        >
          {styleLabel}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="font-body-md text-body-md text-on-surface-variant"
        >
          Criamos uma música única no estilo {styleLabel.toLowerCase()} só para este momento
        </motion.p>
      </SlideWrapper>
    </div>
  );
}
