import { lazy, Suspense } from "react";

const MusicReveal = lazy(() =>
  import("./MusicReveal").then((m) => ({ default: m.MusicReveal }))
);

interface SlideMusicRevealProps {
  isActive?: boolean;
}

export function SlideMusicReveal({ isActive }: SlideMusicRevealProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-gradient-to-b from-surface to-surface-container flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">music_note</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Preparando player...</p>
          </div>
        </div>
      }
    >
      <MusicReveal isActive={isActive} />
    </Suspense>
  );
}
