import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { CountUp } from "./CountUp";
import { SlideWrapper } from "./SlideWrapper";

const OCCASION_LABELS: Record<string, string> = {
  aniversario: "Aniversário",
  amor: "Amor",
  amizade: "Amizade",
  gratidao: "Gratidão",
  outro: "Especial",
};

function computeDaysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function SlideOccasion() {
  const { presente } = useStoryViewer();
  const occasionLabel = OCCASION_LABELS[presente.ocasiao] || presente.ocasiao || "Especial";
  const days = computeDaysSince(presente.data_inicio);

  return (
    <div className="w-full h-full bg-gradient-to-b from-surface to-surface-container">
      <SlideWrapper>
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-label-md text-label-md text-primary uppercase tracking-widest mb-4"
        >
          {presente.nome_remetente ? `de ${presente.nome_remetente}` : ""}
        </motion.span>

        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="font-headline-md text-headline-md md:font-display-lg md:text-display-lg text-on-surface leading-tight">
            {occasionLabel}
          </h1>
        </motion.div>

        {presente.data_inicio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-primary-fixed/50 rounded-2xl px-8 py-6"
          >
            <p className="font-body-md text-body-md text-on-surface-variant mb-1">
              Desde {new Date(presente.data_inicio + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="font-title-lg text-title-lg text-primary">
              <CountUp end={days} suffix=" dias juntos" />
            </p>
          </motion.div>
        )}
      </SlideWrapper>
    </div>
  );
}
