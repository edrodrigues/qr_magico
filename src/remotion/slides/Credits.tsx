import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export function Credits() {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const titleY = interpolate(frame, [0, 20], [30, 0]);
  const ctaOpacity = interpolate(frame, [30, 60], [0, 1]);
  const ctaY = interpolate(frame, [30, 60], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #a93539 0%, #8a282c 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: 48,
        textAlign: "center",
      }}
    >
      <svg
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          opacity: 0.08,
        }}
        viewBox="-100 -100 200 200"
      >
        <circle cx="0" cy="0" r="80" fill="white" />
      </svg>

      <div style={{ position: "relative", zIndex: 10 }}>
        <h2
          style={{
            color: "white",
            fontSize: 52,
            fontWeight: 700,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          Feito com{" "}
          <span style={{ fontStyle: "italic" }}>Momento Mágico</span>
        </h2>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "inline-block",
              border: "2px solid rgba(255,255,255,0.5)",
              borderRadius: 50,
              padding: "16px 48px",
            }}
          >
            <p
              style={{
                color: "white",
                fontSize: 28,
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
