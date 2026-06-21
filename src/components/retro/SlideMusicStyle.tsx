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

const BAR_COUNT = 9;

export function SlideMusicStyle() {
  const { presente } = useStoryViewer();
  const styleLabel = STYLE_LABELS[presente.estilo_musical] || presente.estilo_musical || "Especial";
  const palette = getPalette(presente.estilo_musical);
  const color = palette[1] || palette[0];

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
          className="flex items-end gap-2 h-24 mb-12"
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const baseHeight = 20 + ((i * 37 + 13) % 61);
            return (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 10,
                  backgroundColor: color,
                  height: baseHeight,
                }}
                animate={{
                  height: [baseHeight, baseHeight * 0.5, baseHeight],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            );
          })}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-bold mb-4"
          style={{
            color: palette[0],
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          {styleLabel}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center max-w-xs"
          style={{
            color: "#6b6b6b",
            fontSize: "1.125rem",
            fontFamily: "var(--font-body, sans-serif)",
          }}
        >
          Criamos uma música única no estilo {styleLabel.toLowerCase()} só para este momento
        </motion.p>
      </SlideWrapper>
    </div>
  );
}
