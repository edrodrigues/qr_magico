import { AbsoluteFill, Sequence, Audio, interpolate, useCurrentFrame } from "remotion";
import { Cover } from "./slides/Cover";
import { Occasion } from "./slides/Occasion";
import { Story } from "./slides/Story";
import { Gallery } from "./slides/Gallery";
import { MusicStyle } from "./slides/MusicStyle";
import { Credits } from "./slides/Credits";
import { LogoEnd } from "./slides/LogoEnd";
import { FinalHold } from "./slides/FinalHold";
import { getOccasionTheme, getGenreTheme } from "./theme";
import { getPalette } from "../lib/genrePalettes";
import type { OccasionTheme } from "./theme";

const CONTENT_DURATION = 1530;

export interface RetroInputProps {
  nome_homenageado: string;
  nome_remetente: string;
  ocasiao: string;
  data_inicio: string;
  descricao_relacao: string;
  estilo_musical: string;
  fotos: string[];
  thumbnail_url: string;
  musicaUrl: string | null;
  audioDurationInSeconds?: number;
}

const OCCASION_LABELS: Record<string, string> = {
  aniversario: "Aniversário",
  amor: "Amor",
  amizade: "Amizade",
  gratidao: "Gratidão",
  outro: "Especial",
};

const STYLE_LABELS: Record<string, string> = {
  mpb: "MPB",
  pop: "Pop",
  piano: "Piano Solo",
  lofi: "Lo-fi",
  sertanejo: "Sertanejo",
};

function computeDaysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function FadeTransition({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf8f5",
        opacity: 1 - opacity,
        zIndex: 999,
      }}
    />
  );
}

export function RetrospectivaComposition({
  nome_homenageado,
  nome_remetente,
  ocasiao,
  data_inicio,
  descricao_relacao,
  estilo_musical,
  fotos,
  thumbnail_url,
  musicaUrl,
  audioDurationInSeconds = 0,
}: RetroInputProps) {
  const occasionLabel = OCCASION_LABELS[ocasiao] || ocasiao || "Especial";
  const styleLabel = STYLE_LABELS[estilo_musical] || estilo_musical || "Especial";
  const allPhotos = fotos.length > 0 ? fotos : thumbnail_url ? [thumbnail_url] : [];
  const palette = getPalette(estilo_musical);
  const theme: OccasionTheme = getGenreTheme(palette, ocasiao);
  const daysSince = computeDaysSince(data_inicio);
  const audioFrames = Math.round(audioDurationInSeconds * 30);
  const totalFrames = Math.max(CONTENT_DURATION, audioFrames);
  const extraHoldFrames = totalFrames - CONTENT_DURATION;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf8f5",
      }}
    >
      {musicaUrl && <Audio src={musicaUrl} />}

      <Sequence from={0} durationInFrames={150} name="Cover">
        <Cover nome_homenageado={nome_homenageado} theme={theme} />
      </Sequence>

      <Sequence from={145} durationInFrames={5} name="Fade1">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={150} durationInFrames={150} name="Occasion">
        <Occasion
          nome_remetente={nome_remetente}
          occasionLabel={occasionLabel}
          data_inicio={data_inicio}
          daysSince={daysSince}
          theme={theme}
        />
      </Sequence>

      <Sequence from={295} durationInFrames={5} name="Fade2">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={300} durationInFrames={300} name="Story">
        <Story descricao_relacao={descricao_relacao} theme={theme} />
      </Sequence>

      <Sequence from={595} durationInFrames={5} name="Fade3">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={600} durationInFrames={600} name="Gallery">
        <Gallery fotos={allPhotos} theme={theme} />
      </Sequence>

      <Sequence from={1195} durationInFrames={5} name="Fade4">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={1200} durationInFrames={120} name="MusicStyle">
        <MusicStyle
          styleLabel={styleLabel}
          estilo_musical={estilo_musical}
          theme={theme}
        />
      </Sequence>

      <Sequence from={1315} durationInFrames={5} name="Fade5">
        <FadeTransition durationInFrames={5} />
      </Sequence>

      <Sequence from={1320} durationInFrames={120} name="Credits">
        <Credits
          theme={theme}
          nome_homenageado={nome_homenageado}
          nome_remetente={nome_remetente}
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
