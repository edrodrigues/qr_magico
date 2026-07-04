import {
  buildLegacyOutputKey,
  buildRenderOutputKeys,
  findExistingRenderKey,
} from "./remotion-s3.ts";
import {
  buildAbsentVideoMessage,
  buildFatalErrorMessage,
  buildRenderDiagnostics,
  elapsedMs,
  isConfirmedFatalFailure,
  isVideoAbsentUnrecoverable,
  PROGRESS_GRACE_MS,
  type RenderDiagnostics,
} from "./render-diagnostics.ts";
import {
  extractProgressOutKey,
  extractProgressErrorMessage,
  extractS3KeyFromUrl,
  getRenderProgress,
  isProxyVideoUrl,
  type RenderProgressResult,
} from "./remotion-lambda.ts";
import { checkS3ObjectExists, type AwsS3Config } from "./s3-presign.ts";

export interface PresenteVideoRow {
  id: string;
  video_url?: string | null;
  status: string;
  render_request_id?: string | null;
  generation_started_at?: string | null;
  error_message?: string | null;
}

export interface AwsRenderConfig extends AwsS3Config {
  functionName: string;
}

export type ResolvePresenteVideoResult =
  | { kind: "key"; key: string; debug: RenderDiagnostics }
  | { kind: "pending"; debug: RenderDiagnostics }
  | { kind: "failed"; debug: RenderDiagnostics; errorMessage: string };

/** Candidate S3 keys: render paths + legacy presente path (deduped). */
export function buildCandidateKeys(
  renderId: string | null | undefined,
  presenteId: string,
): string[] {
  const keys = renderId
    ? buildRenderOutputKeys(renderId, presenteId)
    : [];
  const legacy = buildLegacyOutputKey(presenteId);
  if (!keys.includes(legacy)) keys.push(legacy);
  return keys;
}

async function fetchRenderProgress(
  renderId: string,
  aws: AwsRenderConfig,
): Promise<RenderProgressResult | null> {
  return getRenderProgress(renderId, aws.bucket, {
    region: aws.region,
    functionName: aws.functionName,
    accessKeyId: aws.accessKeyId,
    secretAccessKey: aws.secretAccessKey,
  });
}

export async function resolvePresenteVideoKey(
  presente: PresenteVideoRow,
  aws: AwsRenderConfig,
): Promise<ResolvePresenteVideoResult> {
  const presenteId = presente.id;
  const elapsed = elapsedMs(presente.generation_started_at ?? null);
  const renderId = presente.render_request_id ?? null;
  const candidateKeys = buildCandidateKeys(renderId, presenteId);
  const isGenerating = presente.status === "generating";

  if (presente.video_url && !isProxyVideoUrl(presente.video_url)) {
    const directKey = extractS3KeyFromUrl(presente.video_url);
    if (directKey) {
      const debug = buildRenderDiagnostics({
        renderId,
        progress: null,
        s3KeysChecked: [directKey],
        s3Found: true,
        elapsedMs: elapsed,
      });
      return { kind: "key", key: directKey, debug };
    }
  }

  let progress: RenderProgressResult | null = null;
  const pastGrace = elapsed >= PROGRESS_GRACE_MS;

  if (isGenerating && renderId && pastGrace) {
    progress = await fetchRenderProgress(renderId, aws);
    if (progress?.fatalErrorEncountered) {
      console.warn(
        `resolve-presente-video: render ${renderId} fatal (poll): ${extractProgressErrorMessage(progress)}`,
      );
    }
    if (progress?.done) {
      const outKey = extractProgressOutKey(progress);
      if (outKey) {
        const debug = buildRenderDiagnostics({
          renderId,
          progress,
          s3KeysChecked: candidateKeys,
          s3Found: true,
          elapsedMs: elapsed,
        });
        return { kind: "key", key: outKey, debug };
      }
    }
  }

  const s3Key = await findExistingRenderKey(candidateKeys, (k) =>
    checkS3ObjectExists(aws, k)
  );
  const debug = buildRenderDiagnostics({
    renderId,
    progress,
    s3KeysChecked: candidateKeys,
    s3Found: !!s3Key,
    elapsedMs: elapsed,
  });

  if (s3Key) {
    return { kind: "key", key: s3Key, debug };
  }

  if (isGenerating && isConfirmedFatalFailure(debug, elapsed)) {
    return {
      kind: "failed",
      debug,
      errorMessage: buildFatalErrorMessage(debug, elapsed),
    };
  }

  if (isVideoAbsentUnrecoverable(presente.status, !!s3Key, elapsed, debug)) {
    return {
      kind: "failed",
      debug: { ...debug, verdict: "unrecoverable" },
      errorMessage: buildAbsentVideoMessage(
        presente.status,
        presente.error_message,
        debug,
        elapsed,
      ),
    };
  }

  return { kind: "pending", debug };
}
