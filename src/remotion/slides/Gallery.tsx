import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { OccasionTheme } from "../theme";

interface GalleryProps {
  fotos: string[];
  theme: OccasionTheme;
}

const TOTAL_FRAMES = 720;
const MIN_PHOTO_DURATION = 120;
const MAX_PHOTO_DURATION = 300;
const CROSSFADE = 15;

interface KenBurnsConfig {
  zoomIn: boolean;
  panX: number;
  panY: number;
}

const KEN_BURNS_PATTERNS: KenBurnsConfig[] = [
  { zoomIn: true, panX: -2, panY: -1 },
  { zoomIn: true, panX: 2, panY: 1 },
  { zoomIn: false, panX: -1, panY: 2 },
  { zoomIn: false, panX: 1, panY: -2 },
  { zoomIn: true, panX: 0, panY: 0 },
];

function getKenBurns(photoIndex: number): KenBurnsConfig {
  return KEN_BURNS_PATTERNS[photoIndex % KEN_BURNS_PATTERNS.length];
}

function VignetteOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

export function Gallery({ fotos, theme }: GalleryProps) {
  const frame = useCurrentFrame();
  const safeFotos = Array.isArray(fotos) ? fotos : [];

  if (safeFotos.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.lightBgStart} 0%, ${theme.lightBgEnd} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
        }}
      >
        <svg
          style={{ width: 80, height: 80, margin: "0 auto 16px" }}
          viewBox="0 0 24 24"
          fill={theme.secondary}
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
        <p style={{ color: theme.secondary, fontSize: 24 }}>Memórias em breve</p>
      </AbsoluteFill>
    );
  }

  if (safeFotos.length === 1) {
    const kenZoom = interpolate(frame, [0, TOTAL_FRAMES], [1, 1.05]);
    const kenX = interpolate(frame, [0, TOTAL_FRAMES], [0, -3]);
    const kenY = interpolate(frame, [0, TOTAL_FRAMES], [0, -2]);
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
          }}
        />
        <Img
          src={safeFotos[0]}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenZoom}) translate(${kenX}px, ${kenY}px)`,
          }}
        />
        <ColorWashOverlay primary={theme.primary} darkEnd={theme.darkBgEnd} />
        <VignetteOverlay />
      </AbsoluteFill>
    );
  }

  const numPhotos = safeFotos.length;
  const photoDuration = Math.min(
    MAX_PHOTO_DURATION,
    Math.max(MIN_PHOTO_DURATION, Math.floor(TOTAL_FRAMES / numPhotos)),
  );
  const totalUsed = photoDuration * numPhotos;
  const effectiveFrame = Math.min(frame, totalUsed - 1);
  const photoIndex = Math.floor(effectiveFrame / photoDuration);
  const localFrame = effectiveFrame % photoDuration;
  const isFirstPhoto = photoIndex === 0;
  const prevIndex = isFirstPhoto ? photoIndex : photoIndex - 1;
  const nextIndex = photoIndex;
  const crossfadeProgress = isFirstPhoto
    ? 1
    : Math.min(localFrame / CROSSFADE, 1);

  const pattern = getKenBurns(photoIndex);
  const scaleStart = pattern.zoomIn ? 1 : 0.96;
  const scaleEnd = pattern.zoomIn ? 1.05 : 1;
  const kenScale = interpolate(
    localFrame,
    [0, photoDuration],
    [scaleStart, scaleEnd],
  );
  const kenX = interpolate(localFrame, [0, photoDuration], [0, pattern.panX]);
  const kenY = interpolate(localFrame, [0, photoDuration], [0, pattern.panY]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
        }}
      />

      {!isFirstPhoto && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Img
            src={safeFotos[prevIndex]}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 1 - crossfadeProgress,
            }}
          />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0 }}>
        <Img
          src={safeFotos[nextIndex]}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenScale}) translate(${kenX}px, ${kenY}px)`,
            opacity: isFirstPhoto ? 1 : crossfadeProgress,
          }}
        />
      </div>

      <ColorWashOverlay primary={theme.primary} darkEnd={theme.darkBgEnd} />
      <VignetteOverlay />
    </AbsoluteFill>
  );
}

function ColorWashOverlay({
  primary,
  darkEnd,
}: {
  primary: string;
  darkEnd: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, ${primary}08, transparent 50%, ${darkEnd}10)`,
        pointerEvents: "none",
      }}
    />
  );
}
