import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

const GENRE_COLORS: Record<string, string[]> = {
  mpb: ["#2d6b4f", "#6da98c"],
  pop: ["#c44078", "#e889b0"],
  piano: ["#3d5f8a", "#7da0cc"],
  lofi: ["#8a7340", "#c4a86a"],
  sertanejo: ["#7a5a30", "#b89860"],
};

interface MusicStyleProps {
  styleLabel: string;
  estilo_musical: string;
  theme: OccasionTheme;
}

const BAR_COUNT = 9;

export function MusicStyle({ styleLabel, estilo_musical, theme }: MusicStyleProps) {
  const frame = useCurrentFrame();
  const palette = GENRE_COLORS[estilo_musical] || [theme.primary, theme.secondary];
  const color = palette[1] || palette[0];

  const titleOpacity = interpolate(frame, [20, 50], [0, 1]);
  const titleY = interpolate(frame, [20, 50], [20, 0]);
  const subtitleOpacity = interpolate(frame, [50, 80], [0, 1]);
  const subtitleY = interpolate(frame, [50, 80], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette[0]}15, ${palette[1]}10)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "40px 36px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 100,
          marginBottom: 48,
        }}
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const baseHeight = 20 + ((i * 37 + 13) % 61);
          const barAnim = interpolate(
            Math.abs(frame - i * 8) % 50,
            [0, 25, 50],
            [baseHeight, baseHeight * 0.5, baseHeight]
          );
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: barAnim,
                borderRadius: 5,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>

      <h2
        style={{
          color: palette[0],
          fontSize: 52,
          fontWeight: 700,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 16,
        }}
      >
        {styleLabel}
      </h2>

      <p
        style={{
          color: "#6b6b6b",
          fontSize: 22,
          fontFamily: "var(--font-body)",
          textAlign: "center",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          maxWidth: 500,
        }}
      >
        Criamos uma música única no estilo {styleLabel.toLowerCase()} só para este
        momento
      </p>
    </AbsoluteFill>
  );
}
