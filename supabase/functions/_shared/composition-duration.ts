export const COMPOSITION_FPS = 30;
export const CONTENT_DURATION = 1530;
export const MAX_EXTRA_HOLD_FRAMES = 3600;
export const MAX_AUDIO_SECONDS = 180;
export const MAX_DURATION_FRAMES = CONTENT_DURATION + MAX_EXTRA_HOLD_FRAMES;

export interface CompositionDuration {
  durationInFrames: number;
  audioDurationInSeconds: number;
  extraHoldFrames: number;
}

export function resolveCompositionDuration(audioSeconds: number): CompositionDuration {
  const safe =
    Number.isFinite(audioSeconds) && audioSeconds > 0
      ? Math.min(audioSeconds, MAX_AUDIO_SECONDS)
      : 0;

  const audioFrames = Math.round(safe * COMPOSITION_FPS);
  const durationInFrames = Math.min(
    MAX_DURATION_FRAMES,
    Math.max(CONTENT_DURATION, audioFrames),
  );
  const extraHoldFrames = Math.max(0, durationInFrames - CONTENT_DURATION);

  return {
    durationInFrames,
    audioDurationInSeconds: safe,
    extraHoldFrames,
  };
}
