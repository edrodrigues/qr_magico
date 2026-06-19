import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const GENRE_COLORS: Record<string, string[]> = {
  mpb: ["#1a6b4a", "#2d9b6e"],
  pop: ["#a93539", "#f26b6b"],
  piano: ["#2c3e50", "#5d7a9a"],
  lofi: ["#5c4a3a", "#b8a08a"],
  sertanejo: ["#8b5e3c", "#d4a76a"],
};

interface MusicStyleProps {
  styleLabel: string;
  estilo_musical: string;
}

const BAR_HEIGHTS = [12, 48, 24, 56, 16, 40, 20];

export function MusicStyle({ styleLabel, estilo_musical }: MusicStyleProps) {
  const frame = useCurrentFrame();
  const palette = GENRE_COLORS[estilo_musical] || ["#a93539", "#f26b6b"];
  const color = palette[0];

  const titleOpacity = interpolate(frame, [20, 50], [0, 1]);
  const titleY = interpolate(frame, [20, 50], [30, 0]);
  const subtitleOpacity = interpolate(frame, [50, 80], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${color}15, ${palette[1] || color}10)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 64,
          marginBottom: 48,
        }}
      >
        {BAR_HEIGHTS.map((h, i) => {
          const barAnim = interpolate(
            Math.abs(frame - i * 10) % 60,
            [0, 30, 60],
            [h, h * 0.3, h]
          );
          return (
            <div
              key={i}
              style={{
                width: 8,
                height: barAnim,
                borderRadius: 4,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>

      <h2
        style={{
          color,
          fontSize: 56,
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
          maxWidth: 600,
        }}
      >
        Criamos uma música única no estilo {styleLabel.toLowerCase()} só para este momento
      </p>
    </AbsoluteFill>
  );
}
