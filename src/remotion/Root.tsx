import { Composition, getAudioDurationInSeconds } from "remotion";
import { RetrospectivaComposition } from "./RetrospectivaComposition";
import "./assets/fonts.css";

const DEFAULT_DURATION = 1530;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Retrospectiva"
      component={RetrospectivaComposition as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={DEFAULT_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        nome_homenageado: "Nome",
        nome_remetente: "Remetente",
        ocasiao: "aniversario",
        data_inicio: "2024-01-01",
        descricao_relacao: "Uma história especial.",
        estilo_musical: "mpb",
        fotos: [],
        thumbnail_url: "",
        musicaUrl: null,
      }}
      calculateMetadata={async ({ props }) => {
        if (!props.musicaUrl) {
          return { durationInFrames: DEFAULT_DURATION };
        }
        try {
          const audioDurationSeconds = await getAudioDurationInSeconds(props.musicaUrl);
          const audioFrames = Math.round(audioDurationSeconds * 30);
          return {
            durationInFrames: Math.max(DEFAULT_DURATION, audioFrames),
          };
        } catch {
          return { durationInFrames: DEFAULT_DURATION };
        }
      }}
    />
  );
};
