import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { SlideWrapper } from "./SlideWrapper";

function splitSentences(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, 3).map((s) => s.trim() + ".");
}

export function SlideStory() {
  const { presente } = useStoryViewer();
  const sentences = useMemo(() => splitSentences(presente.descricao_relacao), [presente.descricao_relacao]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-surface-container to-surface">
      <SlideWrapper>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="font-label-md text-label-md text-primary uppercase tracking-widest mb-6"
        >
          A História de Vocês
        </motion.h3>

        <div className="space-y-4 max-w-md">
          {sentences.map((sentence, si) => (
            <motion.p
              key={si}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + si * 0.25, duration: 0.4 }}
              className="font-body-lg text-body-lg text-on-surface leading-relaxed"
            >
              {sentence.split(" ").map((word, wi) => (
                <motion.span
                  key={wi}
                  className="inline-block mr-1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + si * 0.25 + wi * 0.04, duration: 0.2 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          ))}
        </div>
      </SlideWrapper>
    </div>
  );
}
