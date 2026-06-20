import { useMemo, useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useRetroData } from "../hooks/useRetroData";
import { StoryViewer } from "../components/retro/StoryViewer";
import { SlideCover } from "../components/retro/SlideCover";
import { SlideOccasion } from "../components/retro/SlideOccasion";
import { SlideStory } from "../components/retro/SlideStory";
import { SlideGallery } from "../components/retro/SlideGallery";
import { SlideMusicStyle } from "../components/retro/SlideMusicStyle";
import { SlideMusicReveal } from "../components/retro/SlideMusicReveal";
import { SlideShare } from "../components/retro/SlideShare";
import { LoadingState } from "../components/retro/LoadingState";
import { VideoPlayer } from "../components/VideoPlayer";
import type { SlideConfig } from "../types/retro";

export function RetrospectivaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error, refetch } = useRetroData(slug ?? "");

  const isGenerating = data?.presente?.status === "generating";

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(refetch, 10000);
    return () => clearInterval(interval);
  }, [isGenerating, refetch]);

  const handleLoadingReady = useCallback(() => {
    refetch();
  }, [refetch]);

  const slides: SlideConfig[] = useMemo(() => [
    { id: "cover", duration: 4000 },
    { id: "occasion", duration: 6000 },
    { id: "story", duration: 8000 },
    { id: "gallery", duration: 8000 },
    { id: "music-style", duration: 4000 },
    { id: "music-reveal", duration: 0, isManual: true },
    { id: "share", duration: 0, isManual: true },
  ], []);

  const renderSlide = useCallback((slide: SlideConfig, index: number) => {
    switch (slide.id) {
      case "cover":
        return <SlideCover />;
      case "occasion":
        return <SlideOccasion />;
      case "story":
        return <SlideStory />;
      case "gallery":
        return <SlideGallery />;
      case "music-style":
        return <SlideMusicStyle />;
      case "music-reveal":
        return <SlideMusicReveal />;
      case "share":
        return <SlideShare />;
      default:
        return <div className="w-full h-full flex items-center justify-center">Slide {index + 1}</div>;
    }
  }, []);

  const thumbnail = data?.presente?.thumbnail_url
    ?? data?.fotos?.[0]?.url
    ?? "";

  const [showVideo, setShowVideo] = useState(true);
  const [videoPlayUrl, setVideoPlayUrl] = useState<string | null>(null);

  const edgeUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    : "";

  useEffect(() => {
    if (!data?.presente?.video_url || !data?.presente?.id) {
      setVideoPlayUrl(null);
      return;
    }
    setVideoPlayUrl(null);
    fetch(`${edgeUrl}/proxy-video?presente_id=${data.presente.id}&format=json`)
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (res?.url) setVideoPlayUrl(res.url);
      })
      .catch(() => {});
  }, [data?.presente?.id, data?.presente?.video_url, edgeUrl]);

  // Loading state
  if (loading && !data) {
    return (
      <div className="bg-soft-cream min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto animate-pulse flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Carregando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-soft-cream min-h-screen flex items-center justify-center px-margin-mobile">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-outline text-4xl">search</span>
          </div>
          <h1 className="font-headline-md-mobile text-headline-md-mobile text-on-surface">
            {error || "Presente não encontrado"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Este link pode estar expirado ou o presente foi removido.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
          >
            Criar meu Momento Mágico
          </Link>
        </div>
      </div>
    );
  }

  const presente = data.presente;

  // Non-ready status messages
  if (presente.status !== "ready" && presente.status !== "generating") {
    const statusMessages: Record<string, { icon: string; title: string; message: string }> = {
      draft: {
        icon: "edit_note",
        title: "Ainda está sendo criado",
        message: "Este presente ainda está sendo preparado. Volte mais tarde!",
      },
      pending_payment: {
        icon: "hourglass_empty",
        title: "Aguardando pagamento",
        message: "O pagamento deste presente ainda não foi confirmado.",
      },
      cancelled: {
        icon: "cancel",
        title: "Não está mais disponível",
        message: "Este presente foi cancelado e não está mais disponível.",
      },
    };
    const info = statusMessages[presente.status] || {
      icon: "help",
      title: "Indisponível",
      message: "Este presente não está disponível no momento.",
    };

    return (
      <div className="bg-soft-cream min-h-screen flex items-center justify-center px-margin-mobile">
        <div className="text-center space-y-6 max-w-md animate-reveal">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-outline text-4xl">{info.icon}</span>
          </div>
          <h1 className="font-headline-md-mobile text-headline-md-mobile text-on-surface">{info.title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{info.message}</p>
          <Link
            to="/"
            className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
          >
            Criar meu Momento Mágico
          </Link>
        </div>
      </div>
    );
  }

  // Generating state
  if (presente.status === "generating") {
    return (
      <div className="w-screen h-screen bg-background">
        <LoadingState status={presente.status} onReady={handleLoadingReady} />
      </div>
    );
  }

  // Show VideoPlayer as main experience when video_url exists
  if (presente.video_url && showVideo) {
    const videoUrl = videoPlayUrl || presente.video_url;
    return (
      <>
        <Helmet>
          <title>Momento Mágico — Para {presente.nome_homenageado}</title>
          <meta property="og:title" content={`Momento Mágico — Para ${presente.nome_homenageado}`} />
          <meta property="og:description" content={`Uma retrospectiva especial de ${presente.ocasiao}${presente.nome_remetente ? ` — por ${presente.nome_remetente}` : ""}`} />
          {thumbnail && <meta property="og:image" content={thumbnail} />}
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>

        <div className="w-screen h-screen bg-black/90 flex items-center justify-center overflow-hidden">
          {thumbnail && (
            <div
              className="hidden md:block absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-30"
              style={{ backgroundImage: `url(${thumbnail})` }}
            />
          )}

          <div className="relative w-full h-full md:h-[90vh] md:w-auto md:aspect-[9/16] md:max-h-[90vh] shadow-2xl">
            <VideoPlayer
              videoUrl={videoUrl}
              posterUrl={thumbnail}
              onShowStory={() => setShowVideo(false)}
            />
          </div>
        </div>
      </>
    );
  }

  // Ready — show the StoryViewer (default or fallback from "Ver História")
  return (
    <>
      <Helmet>
        <title>Momento Mágico — Para {presente.nome_homenageado}</title>
        <meta property="og:title" content={`Momento Mágico — Para ${presente.nome_homenageado}`} />
        <meta property="og:description" content={`Uma retrospectiva especial de ${presente.ocasiao}${presente.nome_remetente ? ` — por ${presente.nome_remetente}` : ""}`} />
        {thumbnail && <meta property="og:image" content={thumbnail} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="w-screen h-screen bg-black/90 flex items-center justify-center overflow-hidden">
        {/* Desktop blurred background */}
        {thumbnail && (
          <div
            className="hidden md:block absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-30"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />
        )}

        {/* 9:16 container */}
        <div className="relative w-full h-full md:h-[90vh] md:w-auto md:aspect-[9/16] md:max-h-[90vh] shadow-2xl">
          <StoryViewer
            slides={slides}
            presente={presente}
            fotos={data.fotos}
            musica={data.musica}
            renderSlide={renderSlide}
          />
        </div>
      </div>
    </>
  );
}
