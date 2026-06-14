import { useMemo, useCallback } from "react";
import { StoryViewer } from "../components/retro/StoryViewer";
import { SlideCover } from "../components/retro/SlideCover";
import { SlideOccasion } from "../components/retro/SlideOccasion";
import { SlideStory } from "../components/retro/SlideStory";
import { SlideGallery } from "../components/retro/SlideGallery";
import { SlideMusicStyle } from "../components/retro/SlideMusicStyle";
import { SlideMusicReveal } from "../components/retro/SlideMusicReveal";
import { SlideShare } from "../components/retro/SlideShare";
import type { SlideConfig, PresenteData, FotoData, MusicaData } from "../types/retro";

const MOCK_PRESENTE: PresenteData = {
  id: "mock",
  slug: "demo",
  usuario_id: "mock",
  nome_homenageado: "Alguém Especial",
  nome_remetente: "Você",
  ocasiao: "amor",
  data_inicio: "2022-06-15",
  data_ocasiao: "",
  descricao_relacao: "Cada quilômetro percorrido, cada risada compartilhada e até os silêncios confortáveis moldaram quem somos hoje. Obrigado por fazer parte da minha jornada de forma tão mágica.",
  estilo_musical: "pop",
  thumbnail_url: "",
  status: "ready",
};

const MOCK_FOTOS: FotoData[] = [
  { id: "f1", presente_id: "mock", url: "https://picsum.photos/seed/1/600/900", ordem: 0 },
  { id: "f2", presente_id: "mock", url: "https://picsum.photos/seed/2/600/900", ordem: 1 },
  { id: "f3", presente_id: "mock", url: "https://picsum.photos/seed/3/600/900", ordem: 2 },
];

const MOCK_MUSICA: MusicaData = {
  id: "m1",
  presente_id: "mock",
  url_audio: null,
  estilo: "pop",
  lyrics: [],
  status: "generating",
};

export function RetrospectivaDesktop() {
  const slides: SlideConfig[] = useMemo(() => [
    { id: "cover", duration: 4000 },
    { id: "occasion", duration: 6000 },
    { id: "story", duration: 8000 },
    { id: "gallery", duration: 8000 },
    { id: "music-style", duration: 4000 },
    { id: "music-reveal", duration: 0, isManual: true },
    { id: "share", duration: 0, isManual: true },
  ], []);

  const renderSlide = useCallback((slide: SlideConfig) => {
    switch (slide.id) {
      case "cover": return <SlideCover />;
      case "occasion": return <SlideOccasion />;
      case "story": return <SlideStory />;
      case "gallery": return <SlideGallery />;
      case "music-style": return <SlideMusicStyle />;
      case "music-reveal": return <SlideMusicReveal />;
      case "share": return <SlideShare />;
      default: return null;
    }
  }, []);

  return (
    <div className="w-screen h-screen bg-black/90 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full md:h-[90vh] md:w-auto md:aspect-[9/16] md:max-h-[90vh] shadow-2xl">
        <StoryViewer
          slides={slides}
          presente={MOCK_PRESENTE}
          fotos={MOCK_FOTOS}
          musica={MOCK_MUSICA}
          renderSlide={renderSlide}
        />
      </div>
    </div>
  );
}
