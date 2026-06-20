import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";

interface GalleryProps {
  fotos: string[];
}

const PHOTO_DURATION = 90;
const CROSSFADE = 15;

export function Gallery({ fotos }: GalleryProps) {
  const frame = useCurrentFrame();

  if (fotos.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, #fcf9f5 0%, #f5f0ea 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
        }}
      >
        <svg style={{ width: 80, height: 80, margin: "0 auto 16px" }} viewBox="0 0 24 24" fill="#c4c4c4">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
        <p style={{ color: "#c4c4c4", fontSize: 24 }}>Memórias em breve</p>
      </AbsoluteFill>
    );
  }

  const totalDuration = fotos.length * PHOTO_DURATION;
  const effectiveFrame = frame % totalDuration;
  const photoIndex = Math.floor(effectiveFrame / PHOTO_DURATION);
  const photoFrame = effectiveFrame % PHOTO_DURATION;

  const isFirstCycle = frame < fotos.length * PHOTO_DURATION && photoIndex === 0;
  const prevIndex = isFirstCycle ? photoIndex : (photoIndex > 0 ? photoIndex - 1 : fotos.length - 1);
  const nextIndex = photoIndex;

  const crossfadeProgress = isFirstCycle ? 1 : Math.min(photoFrame / CROSSFADE, 1);
  const kenBurnsScale = interpolate(photoFrame, [0, PHOTO_DURATION], [1, 1.08]);
  const kenBurnsX = interpolate(photoFrame, [0, PHOTO_DURATION], [0, -1]);
  const kenBurnsY = interpolate(photoFrame, [0, PHOTO_DURATION], [0, -1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {!isFirstCycle && (
        <Img
          src={fotos[prevIndex]}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 1 - crossfadeProgress,
          }}
        />
      )}
      <Img
        src={fotos[nextIndex]}
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

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 128,
          background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          padding: "6px 16px",
          borderRadius: 20,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: 500 }}>
          {photoIndex + 1}/{fotos.length}
        </span>
      </div>
    </AbsoluteFill>
  );
}
