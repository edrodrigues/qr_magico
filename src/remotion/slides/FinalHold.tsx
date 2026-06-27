import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

interface FinalHoldProps {
  theme: OccasionTheme;
}

export function FinalHold({ theme }: FinalHoldProps) {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 15], [0, 1]);
  const logoY = interpolate(frame, [0, 15], [15, 0]);
  const titleOpacity = interpolate(frame, [15, 30], [0, 1]);
  const titleY = interpolate(frame, [15, 30], [15, 0]);
  const taglineOpacity = interpolate(frame, [30, 45], [0, 1]);
  const taglineY = interpolate(frame, [30, 45], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        textAlign: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${theme.darkBgEnd}, ${theme.secondary}66)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
        }}
      >
        <svg width={50} height={50} viewBox="0 0 24 24" fill="white">
          <path d={theme.iconPath} />
        </svg>
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          marginBottom: 12,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
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
