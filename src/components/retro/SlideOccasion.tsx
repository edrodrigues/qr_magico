import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { CountUp } from "./CountUp";
import { SlideWrapper } from "./SlideWrapper";
import { getOccasionTheme } from "../../remotion/theme";

interface SlideOccasionProps {
  isActive?: boolean;
}

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

export function SlideOccasion({ isActive }: SlideOccasionProps) {
  const { presente } = useStoryViewer();
  const theme = getOccasionTheme(presente.ocasiao);
  const occasionLabel = OCCASION_LABELS[presente.ocasiao] || presente.ocasiao || "Especial";
  const days = computeDaysSince(presente.data_inicio);
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  const formattedDate = presente.data_inicio
    ? new Date(presente.data_inicio + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
      }}
    >
      <SlideWrapper>
        <motion.div
          animate={hasBeenActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mb-5"
        >
          <svg
            style={{ width: 48, height: 48 }}
            viewBox="0 0 24 24"
            fill={theme.primary}
          >
            <path d={theme.iconPath} />
          </svg>
        </motion.div>

        {presente.nome_remetente && (
          <motion.span
            animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="font-label-md text-label-md text-primary uppercase tracking-widest mb-4"
            style={{ color: theme.primary }}
          >
            de {presente.nome_remetente}
          </motion.span>
        )}

        <motion.h1
          animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-bold leading-tight mb-10"
          style={{
            color: "#2c2c2c",
            fontSize: "clamp(2.25rem, 7vw, 3.25rem)",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          {occasionLabel}
        </motion.h1>

        {presente.data_inicio && (
          <motion.div
            animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-2xl px-8 py-7 text-center"
            style={{
              background: theme.surface,
              backdropFilter: "blur(12px)",
              border: `1px solid ${theme.secondary}30`,
              boxShadow: `0 8px 32px ${theme.primary}10`,
            }}
          >
            <p
              className="font-body-md text-body-md mb-2"
              style={{ color: "#6b6b6b" }}
            >
              Desde {formattedDate}
            </p>
            <p
              className="font-bold"
              style={{ color: theme.primary, fontSize: "1.625rem" }}
            >
              {hasBeenActive ? (
                <CountUp end={days} suffix=" dias juntos" />
              ) : (
                `0 dias juntos`
              )}
            </p>
          </motion.div>
        )}
      </SlideWrapper>
    </div>
  );
}
