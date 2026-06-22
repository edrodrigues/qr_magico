import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import type { OccasionTheme } from "../theme";

interface StoryProps {
  descricao_relacao: string;
  theme: OccasionTheme;
}

function splitSentences(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, 3).map((s) => s.trim() + ".");
}

export function Story({ descricao_relacao, theme }: StoryProps) {
  const frame = useCurrentFrame();
  const sentences = splitSentences(descricao_relacao);

  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);
  const titleY = interpolate(frame, [0, 15], [-10, 0]);

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
          position: "absolute",
          top: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 2,
          borderRadius: 1,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
          opacity: titleOpacity,
        }}
      />

      <h3
        style={{
          color: "#2c2c2c",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 40,
        }}
      >
        A História de Vocês
      </h3>

      <div
        style={{
          maxWidth: 720,
          textAlign: "center",
          position: "relative",
        }}
      >
        {sentences.map((sentence, si) => {
          const wordDelay = 15 + si * 8;
          const wordStagger = 2;
          const words = sentence.split(" ");

          return (
            <p
              key={si}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 26,
                lineHeight: 1.6,
                color: "#2c2c2c",
                marginBottom: 12,
              }}
            >
              {words.map((word, wi) => {
                const wordStart = wordDelay + wi * wordStagger;
                const wordOpacity = interpolate(
                  frame,
                  [wordStart, wordStart + 5],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                const wordY = interpolate(
                  frame,
                  [wordStart, wordStart + 5],
                  [8, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <span
                    key={wi}
                    style={{
                      opacity: wordOpacity,
                      transform: `translateY(${wordY}px)`,
                      display: "inline-block",
                      marginRight: 8,
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

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 40,
          height: 2,
          borderRadius: 1,
          background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
          opacity: interpolate(frame, [180, 240], [0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
}
