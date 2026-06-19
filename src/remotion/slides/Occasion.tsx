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
  const remetenteY = interpolate(frame, [0, 20], [30, 0]);
  const titleClip = interpolate(frame, [10, 50], [100, 0]);
  const cardOpacity = interpolate(frame, [40, 70], [0, 1]);
  const cardY = interpolate(frame, [40, 70], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fcf9f5 0%, #f5f0ea 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: 48,
      }}
    >
      {nome_remetente && (
        <p
          style={{
            color: "#a93539",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: remetenteOpacity,
            transform: `translateY(${remetenteY}px)`,
            marginBottom: 16,
          }}
        >
          de {nome_remetente}
        </p>
      )}

      <div style={{ overflow: "hidden", marginBottom: 32 }}>
        <h1
          style={{
            color: "#2c2c2c",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            clipPath: `inset(0 ${titleClip}% 0 0)`,
          }}
        >
          {occasionLabel}
        </h1>
      </div>

      {data_inicio && (
        <div
          style={{
            backgroundColor: "rgba(169, 53, 57, 0.08)",
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
              fontSize: 20,
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
          <p style={{ color: "#a93539", fontSize: 28, fontWeight: 700 }}>
            {days} dias juntos
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
}
