import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

interface StoryProps {
  descricao_relacao: string;
  theme: OccasionTheme;
}

const EMOTIONAL_KEYWORDS = new Set([
  "amor", "amo", "feliz", "alegria", "especial", "grato", "gratidão",
  "gratidao", "felicidade", "abençoado", "maravilhoso", "incrível",
  "incrivel", "lindo", "linda", "querido", "querida", "paixão",
  "paixao", "bonito", "bonita", "eterno", "eterna", "saudade",
  "carinho", "estima", "admiro", "admiração", "admiraçao",
  "importante", "coragem", "força", "forca", "sorte",
  "orgulho", "orgulhoso", "conquista", "sonho", "realização",
  "realizacao", "abençoada", "encantador", "radiante",
]);

function splitSentences(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, 3).map((s) => s.trim() + ".");
}

export function Story({ descricao_relacao, theme }: StoryProps) {
  const frame = useCurrentFrame();
  const safeDescricao = typeof descricao_relacao === "string" ? descricao_relacao : "";
  const sentences = splitSentences(safeDescricao);
  const safeSentences = sentences.length > 0 ? sentences : ["Uma história especial."];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "40px 36px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          textAlign: "center",
          position: "relative",
        }}
      >
        {safeSentences.map((sentence, si) => {
          const wordDelay = 10 + si * 8;
          const wordStagger = 1.5;
          const words = sentence.split(" ");

          return (
            <p
              key={si}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 30,
                lineHeight: 1.6,
                color: "#2c2c2c",
                marginBottom: 12,
                position: "relative",
                paddingLeft: 20,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4,
                  bottom: 4,
                  width: 3,
                  borderRadius: 2,
                  background: `linear-gradient(180deg, ${theme.primary}, ${theme.secondary})`,
                  opacity: interpolate(
                    frame,
                    [wordDelay + words.length * wordStagger - 10, wordDelay + words.length * wordStagger],
                    [0, 0.6],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  ),
                }}
              />
              {words.map((word, wi) => {
                const wordStart = wordDelay + wi * wordStagger;
                const wordOpacity = interpolate(
                  frame,
                  [wordStart, wordStart + 5],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                const wordY = interpolate(
                  frame,
                  [wordStart, wordStart + 5],
                  [8, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                );
                const cleanWord = word.replace(/[.,!?;:]/, "").toLowerCase();
                const isKeyword = EMOTIONAL_KEYWORDS.has(cleanWord);
                const highlightColor =
                  isKeyword && frame >= wordStart && frame < wordStart + 12
                    ? theme.primary
                    : undefined;
                return (
                  <span
                    key={wi}
                    style={{
                      opacity: wordOpacity,
                      transform: `translateY(${wordY}px)`,
                      display: "inline-block",
                      marginRight: 8,
                      color: highlightColor ?? "#2c2c2c",
                      transition: "none",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
