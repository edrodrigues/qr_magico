import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";

export function LogoEnd() {
  const frame = useCurrentFrame();

  const logoScale = spring({
    frame,
    fps: 30,
    config: { damping: 10, stiffness: 120 },
  });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1]);
  const textOpacity = interpolate(frame, [30, 60], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 40,
          background: "linear-gradient(135deg, #a93539, #f26b6b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <svg width={80} height={80} viewBox="0 0 24 24" fill="white">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
        </svg>
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: textOpacity,
        }}
      >
        Momento Mágico
      </p>
    </AbsoluteFill>
  );
}
