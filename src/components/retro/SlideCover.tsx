import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { AnimatedBlobBackground } from "./AnimatedBlobBackground";
import { SlideWrapper } from "./SlideWrapper";

export function SlideCover() {
  const { presente } = useStoryViewer();

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary/90 to-coral-deep/90">
      <AnimatedBlobBackground />
      <SlideWrapper className="relative z-10 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <span className="material-symbols-outlined text-5xl">auto_awesome</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-2 leading-tight"
        >
          Uma surpresa para
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
          className="font-headline-md text-headline-md md:font-display-lg md:text-display-lg font-bold mb-12"
        >
          {presente.nome_homenageado}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="font-body-md text-body-md text-white/70"
        >
          Toque para começar
        </motion.p>
      </SlideWrapper>
    </div>
  );
}
