import { Composition } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { RetrospectivaComposition } from "./RetrospectivaComposition";
import { CONTENT_DURATION, resolveCompositionDuration } from "./duration";
import "./assets/fonts.css";

function resolveFromProps(props: Record<string, unknown>) {
  const serverDuration = Number(props.audioDurationInSeconds);
  if (Number.isFinite(serverDuration) && serverDuration > 0) {
    return resolveCompositionDuration(serverDuration);
  }
  return null;
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Retrospectiva"
      component={RetrospectivaComposition as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={CONTENT_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        nome_homenageado: "Nome",
        nome_remetente: "Remetente",
        ocasiao: "aniversario",
        descricao_relacao: "Uma história especial.",
        estilo_musical: "mpb",
        fotos: [],
        thumbnail_url: "",
        musicaUrl: null,
        audioDurationInSeconds: 0,
        skipAudioInRender: false,
      }}
      calculateMetadata={async ({ props }) => {
        if (props.skipAudioInRender) {
          const resolved = resolveFromProps(props as Record<string, unknown>)
            ?? resolveCompositionDuration(0);
          return {
            durationInFrames: resolved.durationInFrames,
            props: {
              ...props,
              musicaUrl: null,
              audioDurationInSeconds: resolved.audioDurationInSeconds,
            },
          };
        }

        const fromServer = resolveFromProps(props as Record<string, unknown>);
        if (fromServer) {
          return {
            durationInFrames: fromServer.durationInFrames,
            props: {
              ...props,
              audioDurationInSeconds: fromServer.audioDurationInSeconds,
            },
          };
        }

        if (!props.musicaUrl) {
          const fallback = resolveCompositionDuration(0);
          return {
            durationInFrames: fallback.durationInFrames,
            props: { ...props, audioDurationInSeconds: 0 },
          };
        }

        try {
          const raw = await getAudioDurationInSeconds(props.musicaUrl as string);
          const resolved = resolveCompositionDuration(raw);
          return {
            durationInFrames: resolved.durationInFrames,
            props: { ...props, audioDurationInSeconds: resolved.audioDurationInSeconds },
          };
        } catch {
          const fallback = resolveCompositionDuration(0);
          return {
            durationInFrames: fallback.durationInFrames,
            props: { ...props, audioDurationInSeconds: 0 },
          };
        }
      }}
    />
  );
};
