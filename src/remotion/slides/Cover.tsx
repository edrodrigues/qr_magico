import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import type { OccasionTheme } from "../theme";

interface CoverProps {
  nome_homenageado: string;
  theme: OccasionTheme;
}

const PARTICLES = [
  { x: 15, y: 20, size: 3, delay: 0 },
  { x: 78, y: 15, size: 2, delay: 20 },
  { x: 50, y: 85, size: 4, delay: 40 },
  { x: 85, y: 70, size: 2, delay: 10 },
  { x: 20, y: 75, size: 3, delay: 50 },
  { x: 65, y: 8, size: 2, delay: 30 },
  { x: 8, y: 60, size: 3, delay: 60 },
  { x: 92, y: 40, size: 2, delay: 15 },
  { x: 40, y: 10, size: 2, delay: 45 },
  { x: 70, y: 88, size: 3, delay: 25 },
];

export function Cover({ nome_homenageado, theme }: CoverProps) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [20, 0]);
  const glowOpacity = interpolate(frame, [0, 150], [0.12, 0.2], {
    extrapolateRight: "clamp",
  });
  const iconOpacity = interpolate(frame, [0, 20], [0, 1]);
  const iconY = interpolate(frame, [0, 20], [20, 0]);
  const iconScale = spring({
    frame: Math.min(frame, 30),
    fps: 30,
    config: { damping: 12, stiffness: 120 },
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
            <stop offset="0%" stopColor={theme.secondary} stopOpacity={glowOpacity} />
            <stop offset="100%" stopColor={theme.darkBgStart} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx="120" ry="120" fill="url(#coverGlow)" />
        <ellipse cx="-60" cy="-50" rx="50" ry="50" fill={`${theme.secondary}08`} />
        <ellipse cx="70" cy="60" rx="40" ry="40" fill={`${theme.secondary}06`} />
      </svg>

      {PARTICLES.map((p, i) => {
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 15, p.delay + 60, p.delay + 90],
          [0, 0.8, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const particleScale = interpolate(
          frame,
          [p.delay, p.delay + 40],
          [0.3, 1],
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
              opacity: particleOpacity,
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
            transform: `translateY(${iconY}px) scale(${iconScale})`,
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
            transform: `translateY(${titleY}px)`,
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
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const charY = interpolate(
              frame,
              [charDelay, charDelay + 10],
              [20, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: charOpacity,
                  transform: `translateY(${charY}px)`,
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
