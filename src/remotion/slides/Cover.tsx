import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";

interface CoverProps {
  nome_homenageado: string;
}

export function Cover({ nome_homenageado }: CoverProps) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [20, 0]);
  const nameScale = spring({
    frame: frame - 30,
    fps: 30,
    config: { damping: 16, stiffness: 100 },
  });
  const nameOpacity = interpolate(frame, [30, 50], [0, 1]);
  const glowOpacity = interpolate(frame, [0, 150], [0.12, 0.2], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #2a2a2a 0%, #4a4a4a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
      }}
    >
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        viewBox="-100 -100 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="coverGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8a7a6a" stopOpacity={glowOpacity} />
            <stop offset="100%" stopColor="#2a2a2a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx="80" ry="80" fill="url(#coverGlow)" />
        <ellipse cx="-40" cy="-30" rx="40" ry="40" fill="rgba(138,122,106,0.05)" />
        <ellipse cx="50" cy="40" rx="30" ry="30" fill="rgba(138,122,106,0.04)" />
      </svg>

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 48px" }}>
        <svg style={{ width: 48, height: 48, margin: "0 auto 20px" }} viewBox="0 0 24 24" fill="white">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
        </svg>

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 22,
            fontWeight: 500,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 8,
          }}
        >
          Uma surpresa para
        </p>

        <h1
          style={{
            color: "white",
            fontSize: 56,
            fontWeight: 700,
            opacity: nameOpacity,
            transform: `scale(${nameScale})`,
            lineHeight: 1.1,
          }}
        >
          {nome_homenageado}
        </h1>
      </div>
    </AbsoluteFill>
  );
}
