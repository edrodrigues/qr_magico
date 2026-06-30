import { AbsoluteFill, Sequence, Audio, interpolate, useCurrentFrame } from "remotion";
import { Cover } from "./slides/Cover";
import { Occasion } from "./slides/Occasion";
import { Story } from "./slides/Story";
import { Gallery } from "./slides/Gallery";
import { Credits } from "./slides/Credits";
import { LogoEnd } from "./slides/LogoEnd";
import { FinalHold } from "./slides/FinalHold";
import { getGenreTheme } from "./theme";
import { getPalette } from "../lib/genrePalettes";
import type { OccasionTheme } from "./theme";
import { CONTENT_DURATION, resolveCompositionDuration } from "./duration";

export interface RetroInputProps {
  nome_homenageado: string;
  nome_remetente: string;
  ocasiao: string;
  descricao_relacao: string;
  estilo_musical: string;
  fotos: string[];
  thumbnail_url: string;
  musicaUrl: string | null;
  audioDurationInSeconds?: number;
  skipAudioInRender?: boolean;
}

const OCCASION_LABELS: Record<string, string> = {
  aniversario: "Aniversário",
  amor: "Amor",
  amizade: "Amizade",
  gratidao: "Gratidão",
  outro: "Especial",
};

function FadeTransition({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const half = Math.floor(durationInFrames / 2);
  const opacity = interpolate(frame, [0, half, durationInFrames], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        opacity,
        zIndex: 999,
      }}
    />
  );
}

export function RetrospectivaComposition({
  nome_homenageado,
  nome_remetente,
  ocasiao,
  descricao_relacao,
  estilo_musical,
  fotos,
  thumbnail_url,
  musicaUrl,
  audioDurationInSeconds = 0,
  skipAudioInRender = false,
}: RetroInputProps) {
  const safeFotos = Array.isArray(fotos) ? fotos : [];
  const safeThumbnailUrl = typeof thumbnail_url === "string" ? thumbnail_url : "";
  const allPhotos = safeFotos.length > 0 ? safeFotos : safeThumbnailUrl ? [safeThumbnailUrl] : [];

  const safeNome = String(nome_homenageado ?? "");
  const safeRemetente = String(nome_remetente ?? "");
  const safeOcasiao = String(ocasiao ?? "");
  const safeDescricao = String(descricao_relacao ?? "");
  const safeEstilo = String(estilo_musical ?? "");

  const occasionLabel = OCCASION_LABELS[safeOcasiao] || safeOcasiao || "Especial";
  const palette = getPalette(safeEstilo);
  const theme: OccasionTheme = getGenreTheme(palette, safeOcasiao);
  const { extraHoldFrames } = resolveCompositionDuration(
    audioDurationInSeconds ?? 0,
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf8f5",
      }}
    >
      {!skipAudioInRender && musicaUrl && (
        <Audio src={musicaUrl} />
      )}

      <Sequence from={0} durationInFrames={150} name="Cover">
        <Cover nome_homenageado={safeNome} theme={theme} />
      </Sequence>

      <Sequence from={145} durationInFrames={5} name="Fade1">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={150} durationInFrames={150} name="Occasion">
        <Occasion
          nome_remetente={safeRemetente}
          occasionLabel={occasionLabel}
          theme={theme}
        />
      </Sequence>

      <Sequence from={295} durationInFrames={5} name="Fade2">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={300} durationInFrames={300} name="Story">
        <Story descricao_relacao={safeDescricao} theme={theme} />
      </Sequence>

      <Sequence from={595} durationInFrames={5} name="Fade3">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={600} durationInFrames={720} name="Gallery">
        <Gallery fotos={allPhotos} theme={theme} />
      </Sequence>

      <Sequence from={1315} durationInFrames={5} name="Fade4">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={1320} durationInFrames={120} name="Credits">
        <Credits
          theme={theme}
          nome_homenageado={safeNome}
          nome_remetente={safeRemetente}
        />
      </Sequence>

      <Sequence from={1435} durationInFrames={5} name="Fade6">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={1440} durationInFrames={90} name="LogoEnd">
        <LogoEnd theme={theme} />
      </Sequence>

      {extraHoldFrames > 0 && (
        <Sequence from={CONTENT_DURATION} durationInFrames={extraHoldFrames} name="FinalHold">
          <FinalHold theme={theme} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
}
