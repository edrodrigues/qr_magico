import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import type { OccasionTheme } from "../theme";

interface LogoEndProps {
  theme: OccasionTheme;
}

const FINAL_PARTICLES = [
  { x: 25, y: 30, size: 2, delay: 15 },
  { x: 75, y: 25, size: 3, delay: 25 },
  { x: 50, y: 80, size: 2, delay: 10 },
  { x: 80, y: 70, size: 2, delay: 35 },
  { x: 20, y: 70, size: 3, delay: 20 },
];

export function LogoEnd({ theme }: LogoEndProps) {
  const frame = useCurrentFrame();

  const logoScale = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 100 },
  });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1]);
  const logoY = interpolate(frame, [0, 15], [15, 0]);
  const textOpacity = interpolate(frame, [30, 60], [0, 1]);
  const textY = interpolate(frame, [30, 60], [15, 0]);
  const taglineOpacity = interpolate(frame, [45, 75], [0, 1]);
  const taglineY = interpolate(frame, [45, 75], [15, 0]);
  const fadeOut = interpolate(frame, [70, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        textAlign: "center",
        opacity: fadeOut,
      }}
    >
      {FINAL_PARTICLES.map((p, i) => {
        const pOpacity = interpolate(
          frame,
          [p.delay, p.delay + 10, p.delay + 40, p.delay + 60],
          [0, 0.6, 0.4, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: theme.secondary,
              opacity: pOpacity,
              boxShadow: `0 0 ${p.size * 3}px ${theme.secondary}`,
            }}
          />
        );
      })}

      <div
        style={{
          opacity: logoOpacity,
          transform: `translateY(${logoY}px) scale(${logoScale})`,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 32,
            background: `linear-gradient(135deg, ${theme.darkBgEnd}, ${theme.secondary}66)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <svg width={60} height={60} viewBox="0 0 24 24" fill="white">
            <path d={theme.iconPath} />
          </svg>
        </div>
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          marginBottom: 12,
        }}
      >
        Momento Mágico
      </p>

      <p
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 24,
          fontWeight: 300,
          fontFamily: "var(--font-body)",
          letterSpacing: 2,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Crie memórias que brilham
      </p>
    </AbsoluteFill>
  );
}
