import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

interface OccasionProps {
  nome_remetente: string;
  occasionLabel: string;
  theme: OccasionTheme;
}

export function Occasion({
  nome_remetente,
  occasionLabel,
  theme,
}: OccasionProps) {
  const frame = useCurrentFrame();

  const remetenteOpacity = interpolate(frame, [0, 20], [0, 1]);
  const remetenteY = interpolate(frame, [0, 20], [20, 0]);
  const titleOpacity = interpolate(frame, [15, 45], [0, 1]);
  const titleY = interpolate(frame, [15, 45], [20, 0]);
  const iconOpacity = interpolate(frame, [0, 25], [0, 1]);
  const iconY = interpolate(frame, [0, 25], [20, 0]);
  const iconScale = interpolate(frame, [0, 25], [0.5, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "40px 36px",
      }}
    >
      <svg
        style={{
          width: 48,
          height: 48,
          marginBottom: 20,
          opacity: iconOpacity,
          transform: `translateY(${iconY}px) scale(${iconScale})`,
        }}
        viewBox="0 0 24 24"
        fill={theme.primary}
      >
        <path d={theme.iconPath} />
      </svg>

      {nome_remetente && (
        <p
          style={{
            color: "#2c2c2c",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: remetenteOpacity,
            transform: `translateY(${remetenteY}px)`,
            marginBottom: 16,
          }}
        >
          de {nome_remetente}
        </p>
      )}

      <h1
        style={{
          color: "#2c2c2c",
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.1,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 40,
        }}
      >
        {occasionLabel}
      </h1>
    </AbsoluteFill>
  );
}
