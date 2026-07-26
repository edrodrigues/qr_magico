import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

interface CoverProps {
  nome_homenageado: string;
  theme: OccasionTheme;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  delay: number;
  speed: number;
  driftX: number;
  driftY: number;
}

const PARTICLES: Particle[] = [
  { x: 15, y: 20, size: 3, delay: 0, speed: 0.4, driftX: 4, driftY: -3 },
  { x: 78, y: 15, size: 2, delay: 20, speed: 0.3, driftX: -3, driftY: 5 },
  { x: 50, y: 85, size: 4, delay: 40, speed: 0.5, driftX: 2, driftY: -4 },
  { x: 85, y: 70, size: 2, delay: 10, speed: 0.35, driftX: -5, driftY: -2 },
  { x: 20, y: 75, size: 3, delay: 50, speed: 0.45, driftX: 3, driftY: 3 },
  { x: 65, y: 8, size: 2, delay: 30, speed: 0.3, driftX: -2, driftY: 4 },
  { x: 8, y: 60, size: 3, delay: 60, speed: 0.4, driftX: 5, driftY: -2 },
  { x: 92, y: 40, size: 2, delay: 15, speed: 0.35, driftX: -4, driftY: 3 },
  { x: 40, y: 10, size: 2, delay: 45, speed: 0.3, driftX: 3, driftY: -5 },
  { x: 70, y: 88, size: 3, delay: 25, speed: 0.4, driftX: -3, driftY: -3 },
];

export function Cover({ nome_homenageado, theme }: CoverProps) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const glowOpacity = interpolate(
    frame,
    [0, 150],
    [0.08, 0.15],
    { extrapolateRight: "clamp" },
  );
  const pulseGlow =
    0.12 + 0.05 * Math.sin((frame / 150) * Math.PI * 2);
  const iconOpacity = interpolate(frame, [0, 20], [0, 1]);
  const iconScale = interpolate(frame, [0, 30], [0.5, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.darkBgStart} 0%, ${theme.darkBgEnd} 100%)`,
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
        viewBox="-150 -150 300 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="coverGlow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={theme.secondary}
              stopOpacity={glowOpacity + pulseGlow * 0.5}
            />
            <stop
              offset="100%"
              stopColor={theme.darkBgStart}
              stopOpacity={0}
            />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx="120" ry="120" fill="url(#coverGlow)" />
        <ellipse cx="-60" cy="-50" rx="50" ry="50" fill={`${theme.secondary}08`} />
        <ellipse cx="70" cy="60" rx="40" ry="40" fill={`${theme.secondary}06`} />
      </svg>

      {PARTICLES.map((p, i) => {
        const fadeIn = interpolate(
          frame,
          [p.delay, p.delay + 15],
          [0, 0.8],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const fadeOut = interpolate(
          frame,
          [p.delay + 60, p.delay + 90],
          [0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const opacity = Math.min(fadeIn, fadeOut);
        const particleScale = interpolate(
          frame,
          [p.delay, p.delay + 40],
          [0.3, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const waveX = Math.sin((frame - p.delay) * 0.03 * p.speed) * p.driftX;
        const waveY = Math.cos((frame - p.delay) * 0.025 * p.speed) * p.driftY;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x + waveX}%`,
              top: `${p.y + waveY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: theme.secondary,
              opacity,
              transform: `scale(${particleScale})`,
              boxShadow: `0 0 ${p.size * 2}px ${theme.secondary}`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <svg
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 24px",
            opacity: iconOpacity,
            transform: `scale(${iconScale})`,
            position: "relative",
            zIndex: 3,
          }}
          viewBox="0 0 24 24"
          fill={theme.primary}
        >
          <path d={theme.iconPath} />
        </svg>

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 32,
            fontWeight: 500,
            opacity: titleOpacity,
            marginBottom: 12,
            position: "relative",
            zIndex: 2,
          }}
        >
          Uma surpresa para
        </p>

        <h1
          style={{
            color: "white",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            position: "relative",
            zIndex: 1,
          }}
        >
          {nome_homenageado.split("").map((char, i) => {
            const charDelay = 30 + i * 2;
            const charOpacity = interpolate(
              frame,
              [charDelay, charDelay + 10],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: charOpacity,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            );
          })}
        </h1>
      </div>
    </AbsoluteFill>
  );
}
