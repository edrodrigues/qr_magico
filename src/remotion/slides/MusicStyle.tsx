import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

const GENRE_COLORS: Record<string, string[]> = {
  mpb: ["#3d5a4a", "#7a9a82"],
  pop: ["#8a5a5a", "#b88a8a"],
  piano: ["#4a5a70", "#7a8aa0"],
  lofi: ["#6a5a4a", "#a09080"],
  sertanejo: ["#7a6a50", "#b0a088"],
};

interface MusicStyleProps {
  styleLabel: string;
  estilo_musical: string;
}

const BAR_HEIGHTS = [12, 48, 24, 56, 16, 40, 20];

export function MusicStyle({ styleLabel, estilo_musical }: MusicStyleProps) {
  const frame = useCurrentFrame();
  const palette = GENRE_COLORS[estilo_musical] || ["#8a7a6a", "#b8a898"];
  const color = palette[1] || palette[0];

  const titleOpacity = interpolate(frame, [20, 50], [0, 1]);
  const titleY = interpolate(frame, [20, 50], [20, 0]);
  const subtitleOpacity = interpolate(frame, [50, 80], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette[0]}15, ${palette[1]}10)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "48px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 64,
          marginBottom: 40,
        }}
      >
        {BAR_HEIGHTS.map((h, i) => {
          const barAnim = interpolate(
            Math.abs(frame - i * 10) % 60,
            [0, 30, 60],
            [h, h * 0.6, h]
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
          color: palette[0],
          fontSize: 44,
          fontWeight: 700,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 12,
        }}
      >
        {styleLabel}
      </h2>

      <p
        style={{
          color: "#6b6b6b",
          fontSize: 20,
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
