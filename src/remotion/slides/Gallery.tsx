import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { OccasionTheme } from "../theme";

interface GalleryProps {
  fotos: string[];
  theme: OccasionTheme;
}

const PHOTO_DURATION = 150;
const CROSSFADE = 15;

const KEN_BURNS_DIRS = [
  { x: [-2, -1] },
  { x: [2, 1] },
  { x: [-1, 2] },
  { x: [1, -2] },
];

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
    const kenBurnsScale = interpolate(frame, [0, 600], [1, 1.04]);
    const kenBurnsX = interpolate(frame, [0, 600], [0, -2]);
    const kenBurnsY = interpolate(frame, [0, 600], [0, -1]);
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
            transform: `scale(${kenBurnsScale}) translate(${kenBurnsX}px, ${kenBurnsY}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 200,
            background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
          }}
        />
      </AbsoluteFill>
    );
  }

  const totalDuration = safeFotos.length * PHOTO_DURATION;
  const safeTotalDuration = totalDuration > 0 ? totalDuration : PHOTO_DURATION;
  const effectiveFrame = frame % safeTotalDuration;
  const photoIndex = Math.floor(effectiveFrame / PHOTO_DURATION);
  const photoFrame = effectiveFrame % PHOTO_DURATION;

  const isFirstCycle = frame < safeTotalDuration && photoIndex === 0;
  const prevIndex = isFirstCycle
    ? photoIndex
    : photoIndex > 0
      ? photoIndex - 1
      : safeFotos.length - 1;
  const nextIndex = Math.min(photoIndex, safeFotos.length - 1);

  const crossfadeProgress = isFirstCycle
    ? 1
    : Math.min(photoFrame / CROSSFADE, 1);

  const dir = KEN_BURNS_DIRS[photoIndex % KEN_BURNS_DIRS.length];
  const kenBurnsScale = interpolate(photoFrame, [0, PHOTO_DURATION], [1, 1.04]);
  const kenBurnsX = interpolate(photoFrame, [0, PHOTO_DURATION], [0, dir.x[0]]);
  const kenBurnsY = interpolate(photoFrame, [0, PHOTO_DURATION], [0, dir.x[1]]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {!isFirstCycle && (
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
            }}
          />
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.darkBgEnd} 100%)`,
          }}
        />
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
            transform: `scale(${kenBurnsScale}) translate(${kenBurnsX}px, ${kenBurnsY}px)`,
            opacity: isFirstCycle ? 1 : crossfadeProgress,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
          background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
        }}
      />
    </AbsoluteFill>
  );
}
