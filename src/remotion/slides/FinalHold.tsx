import { AbsoluteFill } from "remotion";
import type { OccasionTheme } from "../theme";

interface FinalHoldProps {
  theme: OccasionTheme;
}

export function FinalHold({ theme }: FinalHoldProps) {
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
        }}
      >
        <svg width={50} height={50} viewBox="0 0 24 24" fill="white">
          <path d={theme.iconPath} />
        </svg>
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Momento Mágico
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 18,
          fontWeight: 300,
          fontFamily: "var(--font-body)",
          letterSpacing: 2,
        }}
      >
        Crie memórias que brilham
      </p>
    </AbsoluteFill>
  );
}
