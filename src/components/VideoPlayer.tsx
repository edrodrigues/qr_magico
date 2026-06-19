import { useState, useRef, useCallback, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  onShowStory: () => void;
}

export function VideoPlayer({ videoUrl, posterUrl, onShowStory }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setIsLoaded(true);
      video.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? video.currentTime / video.duration : 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      setShowOverlay(true);
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await el.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * video.duration;
  }, []);

  const handleFirstInteraction = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setIsMuted(false);
  }, []);

  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setHasEnded(false);
    setShowOverlay(false);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.share({ url });
    } catch {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      onClick={handleFirstInteraction}
    >
      {posterUrl && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${posterUrl})` }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white text-5xl">play_arrow</span>
              </div>
              <p className="text-white/80 font-body-lg text-body-lg">Carregando...</p>
            </div>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        muted={isMuted}
        poster={posterUrl}
      />

      {!hasEnded && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-16 pb-4 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">
                  {isMuted ? "volume_off" : "volume_up"}
                </span>
              </button>
              <span className="text-white/60 text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(videoRef.current?.duration ?? 0)}
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </div>
      )}

      {showOverlay && hasEnded && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center px-8">
            <button
              onClick={handleReplay}
              className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6 hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-5xl">replay</span>
            </button>
            <p className="text-white font-headline-md text-headline-md mb-6">
              Assista novamente
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleShare}
                className="w-full max-w-xs bg-white/15 text-white px-6 py-3 rounded-full font-label-md text-label-md hover:bg-white/25 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                Compartilhar
              </button>
              <button
                onClick={onShowStory}
                className="w-full max-w-xs bg-white/15 text-white px-6 py-3 rounded-full font-label-md text-label-md hover:bg-white/25 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                Ver Hist\u00f3ria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
