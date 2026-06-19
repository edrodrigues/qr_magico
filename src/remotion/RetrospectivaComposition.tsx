import { AbsoluteFill, Sequence, Audio } from "remotion";
import { Cover } from "./slides/Cover";
import { Occasion } from "./slides/Occasion";
import { Story } from "./slides/Story";
import { Gallery } from "./slides/Gallery";
import { MusicStyle } from "./slides/MusicStyle";
import { Credits } from "./slides/Credits";
import { LogoEnd } from "./slides/LogoEnd";

export interface RetroInputProps {
  nome_homenageado: string;
  nome_remetente: string;
  ocasiao: string;
  data_inicio: string;
  descricao_relacao: string;
  estilo_musical: string;
  fotos: string[];
  thumbnail_url: string;
  musicaUrl: string;
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
}: RetroInputProps) {
  const occasionLabel = OCCASION_LABELS[ocasiao] || ocasiao || "Especial";
  const styleLabel = STYLE_LABELS[estilo_musical] || estilo_musical || "Especial";
  const allPhotos = fotos.length > 0 ? fotos : thumbnail_url ? [thumbnail_url] : [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#fcf9f5" }}>
      {musicaUrl && <Audio src={musicaUrl} />}

      {/* Cover: frames 0-149 (5s) */}
      <Sequence from={0} durationInFrames={150} name="Cover">
        <Cover nome_homenageado={nome_homenageado} />
      </Sequence>

      {/* Occasion: frames 150-299 (5s) */}
      <Sequence from={150} durationInFrames={150} name="Occasion">
        <Occasion
          nome_remetente={nome_remetente}
          occasionLabel={occasionLabel}
          data_inicio={data_inicio}
        />
      </Sequence>

      {/* Story: frames 300-539 (8s) */}
      <Sequence from={300} durationInFrames={240} name="Story">
        <Story descricao_relacao={descricao_relacao} />
      </Sequence>

      {/* Gallery: frames 540-1079 (18s) */}
      <Sequence from={540} durationInFrames={540} name="Gallery">
        <Gallery fotos={allPhotos} />
      </Sequence>

      {/* MusicStyle: frames 1080-1199 (4s) */}
      <Sequence from={1080} durationInFrames={120} name="MusicStyle">
        <MusicStyle styleLabel={styleLabel} estilo_musical={estilo_musical} />
      </Sequence>

      {/* Credits: frames 1200-1319 (4s) */}
      <Sequence from={1200} durationInFrames={120} name="Credits">
        <Credits />
      </Sequence>

      {/* LogoEnd: frames 1320-1409 (3s) */}
      <Sequence from={1320} durationInFrames={90} name="LogoEnd">
        <LogoEnd />
      </Sequence>
    </AbsoluteFill>
  );
}
