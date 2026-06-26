export interface RenderPollDebug {
  render_id?: string | null;
  elapsed_seconds?: number;
  overall_progress?: number | null;
  done?: boolean;
  fatal_error?: boolean;
  remotion_error?: string | null;
  s3_found?: boolean;
  progress_unavailable?: boolean;
  time_to_finish_seconds?: number | null;
  verdict?: string;
}

export function logGeneration(
  presenteId: string,
  phase: string,
  detail?: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return;
  const payload = detail ? ` ${JSON.stringify(detail)}` : "";
  console.info(`[generation] ${presenteId} → ${phase}${payload}`);
}

export function logGenerationPoll(
  presenteId: string,
  status: string,
  debug?: RenderPollDebug,
): void {
  if (!import.meta.env.DEV) return;
  const detail: Record<string, unknown> = { status };
  if (debug) {
    if (debug.overall_progress != null) {
      detail.progress = `${Math.round(debug.overall_progress * 100)}%`;
    }
    if (debug.verdict) detail.verdict = debug.verdict;
    if (debug.elapsed_seconds != null) detail.elapsed_s = debug.elapsed_seconds;
    if (debug.render_id) detail.render_id = debug.render_id;
    if (debug.fatal_error) detail.fatal_error = debug.remotion_error;
    if (debug.progress_unavailable) detail.progress_unavailable = true;
  }
  console.info(`[generation] ${presenteId} → poll_video ${JSON.stringify(detail)}`);
}
