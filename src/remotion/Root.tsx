import { Composition } from "remotion";
import { RetrospectivaComposition } from "./RetrospectivaComposition";
import "./assets/fonts.css";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Retrospectiva"
      component={RetrospectivaComposition as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={1410}
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
        musicaUrl: "",
      }}
    />
  );
};
