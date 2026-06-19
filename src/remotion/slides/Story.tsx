import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface StoryProps {
  descricao_relacao: string;
}

function splitSentences(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, 3).map((s) => s.trim() + ".");
}

export function Story({ descricao_relacao }: StoryProps) {
  const frame = useCurrentFrame();
  const sentences = splitSentences(descricao_relacao);

  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #f5f0ea 0%, #fcf9f5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        padding: "48px 56px",
      }}
    >
      <h3
        style={{
          color: "#a93539",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: titleOpacity,
          marginBottom: 40,
        }}
      >
        A História de Vocês
      </h3>

      <div style={{ maxWidth: 700, textAlign: "center" }}>
        {sentences.map((sentence, si) => {
          const wordDelay = 15 + si * 8;
          const wordStagger = 3;
          const words = sentence.split(" ");

          return (
            <p
              key={si}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 32,
                lineHeight: 1.6,
                color: "#2c2c2c",
                marginBottom: 12,
              }}
            >
              {words.map((word, wi) => {
                const wordStart = wordDelay + wi * wordStagger;
                const wordOpacity = interpolate(frame, [wordStart, wordStart + 5], [0, 1]);
                return (
                  <span
                    key={wi}
                    style={{
                      opacity: wordOpacity,
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
    </AbsoluteFill>
  );
}
