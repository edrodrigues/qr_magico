import type { RenderPollDebug } from "./generationDebug";

const LONG_PROCESSING_THRESHOLD_SEC = 5 * 60;

const VERDICT_DEV_NOTES: Record<string, string> = {
  grace_period: "verdict: grace_period — aguardando 30s",
  rendering: "verdict: rendering — Lambda Remotion em andamento",
  waiting_s3: "verdict: waiting_s3 — aguardando out.mp4 no S3",
  failed_remotion: "verdict: failed_remotion — falha no servidor Remotion",
};

export interface VideoRenderUiState {
  message?: string;
  hint?: string;
  errorMessage?: string;
  technicalNote?: string;
}

function formatProgressMessage(debug: RenderPollDebug): string {
  const pct = Math.round((debug.overall_progress ?? 0) * 100);
  if (debug.time_to_finish_seconds != null && debug.time_to_finish_seconds > 0) {
    const mins = Math.ceil(debug.time_to_finish_seconds / 60);
    return `Renderizando vídeo… ${pct}% (~${mins} min restantes)`;
  }
  return `Renderizando vídeo… ${pct}%`;
}

function buildDevNote(debug?: RenderPollDebug, extra?: string): string | undefined {
  if (!import.meta.env.DEV) return undefined;
  const parts: string[] = [];
  if (debug?.verdict && VERDICT_DEV_NOTES[debug.verdict]) {
    parts.push(VERDICT_DEV_NOTES[debug.verdict]);
  } else if (debug?.verdict) {
    parts.push(`verdict: ${debug.verdict}`);
  }
  if (debug?.render_id) parts.push(`render_id: ${debug.render_id}`);
  if (debug?.elapsed_seconds != null) parts.push(`elapsed: ${debug.elapsed_seconds}s`);
  if (debug?.progress_unavailable) parts.push("progress_unavailable: true");
  if (extra) parts.push(extra);
  return parts.length > 0 ? `[dev] ${parts.join(" | ")}` : undefined;
}

export function formatRenderErrorForUser(raw?: string | null): string {
  if (!raw?.trim()) {
    return "Não foi possível gerar o vídeo. Tente novamente ou entre em contato com o suporte.";
  }
  const lower = raw.toLowerCase();
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "O servidor de vídeo excedeu o tempo limite ao processar suas fotos. Tente novamente em alguns minutos.";
  }
  if (lower.includes("invalid array length")) {
    return "Falha na renderização do vídeo. Tente gerar novamente.";
  }
  if (lower.includes("falha na renderização") || lower.includes("renderização do vídeo")) {
    const short = raw.split(/Render ID:|https?:\/\//)[0].trim();
    if (short.length > 20 && short.length < 200) return short;
  }
  return "Não foi possível gerar o vídeo. Tente novamente ou entre em contato com o suporte.";
}

export function formatRenderErrorTechnical(
  raw?: string | null,
  debug?: RenderPollDebug,
): string | undefined {
  if (!import.meta.env.DEV) return undefined;
  const parts: string[] = [];
  if (debug?.verdict) parts.push(`verdict: ${debug.verdict}`);
  if (debug?.render_id) parts.push(`render_id: ${debug.render_id}`);
  if (raw) {
    const firstLine = raw.split(/\n|▸/)[0].trim().slice(0, 200);
    if (firstLine) parts.push(firstLine);
  }
  return parts.length > 0 ? `[dev] ${parts.join(" | ")}` : undefined;
}

export function buildVideoProcessingUi(input: {
  debug?: RenderPollDebug;
  defaultMessage?: string;
  isStuck?: boolean;
}): VideoRenderUiState {
  const { debug, defaultMessage, isStuck } = input;
  const elapsed = debug?.elapsed_seconds ?? 0;
  const verdict = debug?.verdict;
  const longWaitHint =
    elapsed >= LONG_PROCESSING_THRESHOLD_SEC
      ? "Está demorando mais que o normal. Aguarde alguns minutos."
      : undefined;

  if (isStuck) {
    return {
      message: defaultMessage,
      hint: "Processamento demorou mais que o esperado. Você pode tentar novamente.",
      errorMessage: "Processamento demorou mais que o esperado.",
      technicalNote: buildDevNote(debug),
    };
  }

  if (verdict === "grace_period") {
    return {
      message: "Iniciando a renderização do vídeo...",
      technicalNote: buildDevNote(debug),
    };
  }

  if (verdict === "waiting_s3") {
    return {
      message: "Vídeo renderizado! Finalizando o envio...",
      technicalNote: buildDevNote(debug),
    };
  }

  if (verdict === "failed_remotion") {
    return {
      message: defaultMessage,
      errorMessage: formatRenderErrorForUser(debug?.remotion_error),
      hint: "Detectamos um problema na renderização. O sistema finalizará em instantes ou você pode tentar novamente.",
      technicalNote: buildDevNote(debug, debug?.remotion_error?.split(/\n/)[0]),
    };
  }

  if (debug?.overall_progress != null) {
    return {
      message: formatProgressMessage(debug),
      hint: longWaitHint,
      technicalNote: buildDevNote(debug),
    };
  }

  if (verdict === "rendering" || elapsed >= LONG_PROCESSING_THRESHOLD_SEC) {
    return {
      message: defaultMessage ?? "Música pronta! Renderizando o vídeo com suas fotos...",
      hint: longWaitHint,
      technicalNote: buildDevNote(debug),
    };
  }

  return {
    message: defaultMessage,
    technicalNote: buildDevNote(debug),
  };
}
