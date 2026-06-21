import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import type { OccasionTheme } from "../theme";

interface CreditsProps {
  theme: OccasionTheme;
  nome_homenageado: string;
  nome_remetente: string;
}

export function Credits({ theme, nome_homenageado, nome_remetente }: CreditsProps) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [20, 0]);
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1]);
  const ctaOpacity = interpolate(frame, [50, 80], [0, 1]);
  const ctaScale = spring({
    frame: Math.max(frame - 60, 0),
    fps: 30,
    config: { damping: 8, stiffness: 200 },
  });

  const currentYear = new Date().getFullYear();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${theme.darkBgStart} 0%, ${theme.darkBgEnd} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: 40,
        textAlign: "center",
      }}
    >
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.06,
        }}
        viewBox="-150 -150 300 300"
      >
        <circle cx="0" cy="0" r="120" fill="white" />
      </svg>

      <div style={{ position: "relative", zIndex: 10 }}>
        <h2
          style={{
            color: "white",
            fontSize: 52,
            fontWeight: 700,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          Feito com{" "}
          <span style={{ fontStyle: "italic" }}>Momento Mágico</span>
        </h2>

        <p
          style={{
            color: theme.secondary,
            fontSize: 22,
            fontFamily: "var(--font-body)",
            opacity: subtitleOpacity,
            marginBottom: 8,
          }}
        >
          {nome_remetente && nome_homenageado
            ? `${nome_remetente} para ${nome_homenageado}`
            : nome_remetente || nome_homenageado || ""}
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            opacity: subtitleOpacity,
            marginBottom: 48,
          }}
        >
          {currentYear}
        </p>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: "inline-block",
              border: `2px solid ${theme.secondary}66`,
              borderRadius: 50,
              padding: "16px 56px",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <p
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              Crie o seu
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
