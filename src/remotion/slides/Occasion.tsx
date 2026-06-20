import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface OccasionProps {
  nome_remetente: string;
  occasionLabel: string;
  data_inicio: string;
}

function computeDaysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function Occasion({ nome_remetente, occasionLabel, data_inicio }: OccasionProps) {
  const frame = useCurrentFrame();
  const days = computeDaysSince(data_inicio);

  const remetenteOpacity = interpolate(frame, [0, 20], [0, 1]);
  const remetenteY = interpolate(frame, [0, 20], [20, 0]);
  const titleOpacity = interpolate(frame, [15, 45], [0, 1]);
  const titleY = interpolate(frame, [15, 45], [20, 0]);
  const cardOpacity = interpolate(frame, [40, 70], [0, 1]);
  const cardY = interpolate(frame, [40, 70], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #faf8f5 0%, #f5f0ea 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "48px 64px",
      }}
    >
      {nome_remetente && (
        <p
          style={{
            color: "#8a7a6a",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: remetenteOpacity,
            transform: `translateY(${remetenteY}px)`,
            marginBottom: 12,
          }}
        >
          de {nome_remetente}
        </p>
      )}

      <h1
        style={{
          color: "#2c2c2c",
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.1,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 32,
        }}
      >
        {occasionLabel}
      </h1>

      {data_inicio && (
        <div
          style={{
            backgroundColor: "rgba(138, 122, 106, 0.08)",
            borderRadius: 16,
            padding: "24px 48px",
            textAlign: "center",
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
          }}
        >
          <p
            style={{
              color: "#6b6b6b",
              fontSize: 18,
              fontFamily: "var(--font-body)",
              marginBottom: 8,
            }}
          >
            Desde {new Date(data_inicio + "T12:00:00").toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p style={{ color: "#8a7a6a", fontSize: 24, fontWeight: 700 }}>
            {days} dias juntos
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
}
