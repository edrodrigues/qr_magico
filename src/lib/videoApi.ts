import type { Session } from "@supabase/supabase-js";
import type { RenderPollDebug } from "./generationDebug";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export type PresenteVideoStatus = "ready" | "pending" | "failed" | "error" | "unknown";

export interface PresenteVideoStatusResponse {
  status: PresenteVideoStatus;
  presente_id?: string;
  download_url?: string;
  error_message?: string;
  debug?: RenderPollDebug;
  httpStatus: number;
}

export async function fetchPresenteVideoStatus(
  session: Session,
  presenteId: string,
): Promise<PresenteVideoStatusResponse> {
  const res = await fetch(`${EDGE_URL}/get-download-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ presente_id: presenteId }),
  });

  const data = await res.json();
  const status = (data.status ||
    (res.ok ? "unknown" : "error")) as PresenteVideoStatus;

  return {
    status,
    presente_id: data.presente_id,
    download_url: data.download_url,
    error_message: data.error_message,
    debug: data.debug as RenderPollDebug | undefined,
    httpStatus: res.status,
  };
}
