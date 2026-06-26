import type { RenderProgressResult } from "./remotion-lambda.ts";
import { extractProgressErrorMessage } from "./remotion-lambda.ts";

export const PROGRESS_GRACE_MS = 30_000;
export const FATAL_CONFIRM_MS = 3 * 60_000;

export type RenderVerdict = "rendering" | "failed_remotion" | "waiting_s3" | "grace_period";

export interface RenderDiagnostics {
  render_id: string | null;
  elapsed_seconds: number;
  overall_progress: number | null;
  done: boolean;
  fatal_error: boolean;
  remotion_error: string | null;
  s3_found: boolean;
  s3_keys_checked: string[];
  progress_unavailable: boolean;
  time_to_finish_seconds: number | null;
  verdict: RenderVerdict;
}

export function elapsedMs(generationStartedAt: string | null): number {
  if (!generationStartedAt) return 0;
  const started = new Date(generationStartedAt).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Date.now() - started);
}

function resolveVerdict(
  progress: RenderProgressResult | null,
  s3Found: boolean,
  elapsed: number,
): RenderVerdict {
  if (elapsed < PROGRESS_GRACE_MS) return "grace_period";
  if (progress?.fatalErrorEncountered && !progress.done) return "failed_remotion";
  if (progress?.done && !s3Found) return "waiting_s3";
  return "rendering";
}

export function buildRenderDiagnostics(input: {
  renderId: string | null;
  progress: RenderProgressResult | null;
  s3KeysChecked: string[];
  s3Found: boolean;
  elapsedMs: number;
}): RenderDiagnostics {
  const { renderId, progress, s3KeysChecked, s3Found, elapsedMs: elapsed } = input;
  const progressUnavailable = renderId !== null && elapsed >= PROGRESS_GRACE_MS && progress === null;

  return {
    render_id: renderId,
    elapsed_seconds: Math.round(elapsed / 1000),
    overall_progress: progress?.overallProgress ?? null,
    done: progress?.done ?? false,
    fatal_error: progress?.fatalErrorEncountered ?? false,
    remotion_error: progress?.fatalErrorEncountered
      ? extractProgressErrorMessage(progress)
      : null,
    s3_found: s3Found,
    s3_keys_checked: s3KeysChecked,
    progress_unavailable: progressUnavailable,
    time_to_finish_seconds: progress?.timeToFinish ?? null,
    verdict: resolveVerdict(progress, s3Found, elapsed),
  };
}

export function isDeterministicRemotionError(error: string | null | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return lower.includes("invalid array length") || lower.includes("invalid array");
}

export function isConfirmedFatalFailure(
  diagnostics: RenderDiagnostics,
  elapsedMs: number,
): boolean {
  if (!diagnostics.fatal_error || diagnostics.done) return false;

  if (
    elapsedMs >= PROGRESS_GRACE_MS &&
    isDeterministicRemotionError(diagnostics.remotion_error)
  ) {
    return true;
  }

  return elapsedMs >= FATAL_CONFIRM_MS;
}

export function summarizeRemotionError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "Tempo limite do servidor de vídeo excedido.";
  }
  if (lower.includes("invalid array length")) {
    return "Falha na renderização do vídeo. Tente gerar novamente.";
  }
  return "Renderização do vídeo falhou.";
}

export function buildFatalErrorMessage(
  diagnostics: RenderDiagnostics,
  elapsedMs: number,
): string {
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
  const err = diagnostics.remotion_error
    ? summarizeRemotionError(diagnostics.remotion_error)
    : "Renderização do vídeo falhou.";
  const renderId = diagnostics.render_id || "desconhecido";
  return `${err} Render ID: ${renderId}. Tempo: ${minutes}min.`;
}

export function buildFatalErrorLogDetail(
  diagnostics: RenderDiagnostics,
  elapsedMs: number,
): string {
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
  const raw = diagnostics.remotion_error || "unknown";
  const renderId = diagnostics.render_id || "desconhecido";
  return `Falha na renderização (Remotion): ${raw} Render ID: ${renderId}. Tempo: ${minutes}min.`;
}
