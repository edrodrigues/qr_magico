import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { SlideWrapper } from "./SlideWrapper";
import { getOccasionTheme } from "../../remotion/theme";

interface SlideStoryProps {
  isActive?: boolean;
}

function splitSentences(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, 3).map((s) => s.trim() + ".");
}

export function SlideStory({ isActive }: SlideStoryProps) {
  const { presente } = useStoryViewer();
  const theme = getOccasionTheme(presente.ocasiao);
  const sentences = useMemo(() => splitSentences(presente.descricao_relacao), [presente.descricao_relacao]);
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
      }}
    >
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
        style={{
          width: 60,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
        }}
      />

      <SlideWrapper>
        <motion.h3
          animate={hasBeenActive ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="font-label-md text-label-md uppercase tracking-widest mb-6"
          style={{ color: theme.primary }}
        >
          A História de Vocês
        </motion.h3>

        <div className="space-y-4 max-w-md">
          {sentences.map((sentence, si) => (
            <motion.p
              key={si}
              animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ delay: 0.3 + si * 0.25, duration: 0.4 }}
              className="leading-relaxed"
              style={{
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "1.125rem",
                color: "#2c2c2c",
              }}
            >
              {sentence.split(" ").map((word, wi) => (
                <motion.span
                  key={wi}
                  className="inline-block mr-1"
                  animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ delay: 0.5 + si * 0.25 + wi * 0.04, duration: 0.2 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          ))}
        </div>
      </SlideWrapper>

      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
        style={{
          width: 40,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
        }}
      />
    </div>
  );
}
