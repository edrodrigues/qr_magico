import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStoryViewer } from "./StoryViewerContext";
import { SlideWrapper } from "./SlideWrapper";
import { getOccasionTheme } from "../../remotion/theme";

interface SlideCoverProps {
  isActive?: boolean;
}

const PARTICLES = [
  { x: 15, y: 20, size: 3 },
  { x: 78, y: 15, size: 2 },
  { x: 50, y: 85, size: 4 },
  { x: 85, y: 70, size: 2 },
  { x: 20, y: 75, size: 3 },
  { x: 65, y: 8, size: 2 },
  { x: 8, y: 60, size: 3 },
  { x: 92, y: 40, size: 2 },
  { x: 40, y: 10, size: 2 },
  { x: 70, y: 88, size: 3 },
];

export function SlideCover({ isActive }: SlideCoverProps) {
  const { presente } = useStoryViewer();
  const theme = getOccasionTheme(presente.ocasiao);
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.darkBgStart} 0%, ${theme.darkBgEnd} 100%)`,
      }}
    >
      <svg
        className="absolute w-full h-full"
        viewBox="-150 -150 300 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.5 }}
      >
        <defs>
          <radialGradient id="coverGlowWeb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.secondary} stopOpacity={0.15} />
            <stop offset="100%" stopColor={theme.darkBgStart} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx="120" ry="120" fill="url(#coverGlowWeb)" />
        <ellipse cx="-60" cy="-50" rx="50" ry="50" fill={`${theme.secondary}08`} />
        <ellipse cx="70" cy="60" rx="40" ry="40" fill={`${theme.secondary}06`} />
      </svg>

      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: theme.secondary,
            boxShadow: `0 0 ${p.size * 2}px ${theme.secondary}`,
          }}
          animate={
            hasBeenActive
              ? { opacity: [0, 0.8, 0.6, 0], scale: [0.3, 1, 1, 0.3] }
              : { opacity: 0, scale: 0.3 }
          }
          transition={{
            duration: 4,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      ))}

      <SlideWrapper className="relative z-10 text-white">
        <motion.div
          animate={hasBeenActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <svg
            style={{ width: 56, height: 56 }}
            viewBox="0 0 24 24"
            fill={theme.primary}
          >
            <path d={theme.iconPath} />
          </svg>
        </motion.div>

        <motion.p
          animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-white/70 text-[1.75rem] font-medium mb-3 leading-tight"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          Uma surpresa para
        </motion.p>

        <motion.h1
          className="font-bold leading-tight"
          style={{
            color: "white",
            fontSize: "clamp(2.5rem, 8vw, 4.25rem)",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          {presente.nome_homenageado.split("").map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              animate={hasBeenActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.6 + i * 0.03, duration: 0.3 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>
      </SlideWrapper>
    </div>
  );
}
