import { AbsoluteFill, useCurrentFrame, interpolate, Img, Video } from "remotion";
import type { OccasionTheme } from "../theme";
import type { MediaItem } from "../RetrospectivaComposition";

interface GalleryProps {
  media: MediaItem[];
  theme: OccasionTheme;
}

const MIN_ITEM_DURATION = 120;
const MAX_ITEM_DURATION = 300;
const CROSSFADE = 15;
const TOTAL_FRAMES = 720;

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

function getKenBurns(index: number): KenBurnsConfig {
  return KEN_BURNS_PATTERNS[index % KEN_BURNS_PATTERNS.length];
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

function ColorWashOverlay({ primary, darkEnd }: { primary: string; darkEnd: string }) {
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

function PhotoItem({
  src,
  durationInFrames,
  kenBurns,
}: {
  src: string;
  durationInFrames: number;
  kenBurns: KenBurnsConfig;
}) {
  const frame = useCurrentFrame();
  const scaleStart = kenBurns.zoomIn ? 1 : 0.96;
  const scaleEnd = kenBurns.zoomIn ? 1.05 : 1;
  const kenScale = interpolate(frame, [0, durationInFrames], [scaleStart, scaleEnd]);
  const kenX = interpolate(frame, [0, durationInFrames], [0, kenBurns.panX]);
  const kenY = interpolate(frame, [0, durationInFrames], [0, kenBurns.panY]);

  return (
    <Img
      src={src}
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
      }}
    />
  );
}

function VideoItem({
  src,
  durationInFrames,
}: {
  src: string;
  durationInFrames: number;
}) {
  return (
    <Video
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
      muted
      startFrom={0}
      endAt={durationInFrames}
    />
  );
}

export function Gallery({ media, theme }: GalleryProps) {
  const frame = useCurrentFrame();
  const safeMedia = Array.isArray(media) ? media : [];

  if (safeMedia.length === 0) {
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

  if (safeMedia.length === 1) {
    const item = safeMedia[0];
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
        {item.type === "video" ? (
          <Video
            src={item.url}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            muted
            startFrom={0}
            endAt={TOTAL_FRAMES}
          />
        ) : (
          <Img
            src={item.url}
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
        )}
        <ColorWashOverlay primary={theme.primary} darkEnd={theme.darkBgEnd} />
        <VignetteOverlay />
      </AbsoluteFill>
    );
  }

  const numItems = safeMedia.length;
  const itemDuration = Math.min(
    MAX_ITEM_DURATION,
    Math.max(MIN_ITEM_DURATION, Math.floor(TOTAL_FRAMES / numItems))
  );
  const totalUsed = itemDuration * numItems;
  const effectiveFrame = Math.min(frame, totalUsed - 1);
  const itemIndex = Math.floor(effectiveFrame / itemDuration);
  const localFrame = effectiveFrame % itemDuration;
  const isFirst = itemIndex === 0;
  const crossfadeProgress = isFirst ? 1 : Math.min(localFrame / CROSSFADE, 1);

  const currentItem = safeMedia[itemIndex];
  const prevItem = isFirst ? currentItem : safeMedia[itemIndex - 1];

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
        }}
      />

      {!isFirst && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - crossfadeProgress }}>
          {prevItem.type === "video" ? (
            <Video
              src={prevItem.url}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              muted
              startFrom={0}
              endAt={itemDuration}
            />
          ) : (
            <Img
              src={prevItem.url}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, opacity: isFirst ? 1 : crossfadeProgress }}>
        {currentItem.type === "video" ? (
          <VideoItem src={currentItem.url} durationInFrames={itemDuration} />
        ) : (
          <PhotoItem
            src={currentItem.url}
            durationInFrames={itemDuration}
            kenBurns={getKenBurns(itemIndex)}
          />
        )}
      </div>

      <ColorWashOverlay primary={theme.primary} darkEnd={theme.darkBgEnd} />
      <VignetteOverlay />
    </AbsoluteFill>
  );
}
