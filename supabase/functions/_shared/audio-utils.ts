import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export const ELEVENLABS_MUSIC_LENGTH_SEC = 60;
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";

const MIN_MP3_BYTES = 4096;
const MIN_AUDIO_BYTES = 200_000;
const MAX_AUDIO_BYTES = 2_500_000;
const MAX_DOWNLOAD_BYTES = 5_000_000;
const MIN_DURATION_SEC = 50;
const MAX_DURATION_SEC = 70;

const MPEG_BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];
const MPEG_SAMPLE_RATES: Record<number, number[]> = {
  3: [11025, 12000, 8000],
  2: [22050, 24000, 16000],
  0: [44100, 48000, 32000],
};

export function isValidMp3Header(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false;

  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }

  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return true;
  }

  return false;
}

function skipId3Tag(bytes: Uint8Array): number {
  if (bytes.length < 10) return 0;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;
  const size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);
  return 10 + size;
}

function parseMpegFrameHeader(bytes: Uint8Array, offset: number): {
  frameLength: number;
  samplesPerFrame: number;
  sampleRate: number;
} | null {
  if (offset + 4 > bytes.length) return null;

  const b0 = bytes[offset];
  const b1 = bytes[offset + 1];
  const b2 = bytes[offset + 2];
  const b3 = bytes[offset + 3];

  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null;

  const version = (b1 >> 3) & 0x03;
  const layer = (b1 >> 1) & 0x03;
  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;

  if (layer !== 0x01 || bitrateIndex === 0 || bitrateIndex === 0x0f || sampleRateIndex === 0x03) {
    return null;
  }

  const bitrate = MPEG_BITRATES[bitrateIndex] * 1000;
  const sampleRate = MPEG_SAMPLE_RATES[version]?.[sampleRateIndex];
  if (!bitrate || !sampleRate) return null;

  const samplesPerFrame = version === 3 ? 1152 : 576;
  const frameLength = Math.floor((samplesPerFrame / 8 * bitrate) / sampleRate) + padding;

  if (frameLength < 4 || frameLength > 4096) return null;

  return { frameLength, samplesPerFrame, sampleRate };
}

export function estimateMp3DurationSeconds(bytes: Uint8Array): number | null {
  let offset = skipId3Tag(bytes);
  let totalSamples = 0;
  let sampleRate = 0;
  let frames = 0;
  const maxFrames = 5000;

  while (offset + 4 < bytes.length && frames < maxFrames) {
    const header = parseMpegFrameHeader(bytes, offset);
    if (!header) {
      offset += 1;
      continue;
    }
    totalSamples += header.samplesPerFrame;
    sampleRate = header.sampleRate;
    offset += header.frameLength;
    frames += 1;
  }

  if (frames < 10 || sampleRate <= 0) return null;
  return totalSamples / sampleRate;
}

export function validateAudioBytes(
  bytes: Uint8Array,
): { ok: boolean; size: number; durationSec?: number; error?: string } {
  const size = bytes.byteLength;

  if (!isValidMp3Header(bytes)) {
    return { ok: false, size, error: "Header MP3 inválido" };
  }

  if (size < MIN_AUDIO_BYTES) {
    return { ok: false, size, error: `Arquivo muito pequeno (${size} bytes)` };
  }

  if (size > MAX_AUDIO_BYTES) {
    return { ok: false, size, error: `Arquivo muito grande (${size} bytes)` };
  }

  const durationSec = estimateMp3DurationSeconds(bytes);
  if (durationSec === null) {
    return { ok: false, size, error: "Não foi possível estimar duração do MP3" };
  }

  if (durationSec < MIN_DURATION_SEC || durationSec > MAX_DURATION_SEC) {
    return {
      ok: false,
      size,
      durationSec,
      error: `Duração fora do esperado (${durationSec.toFixed(1)}s, esperado ${MIN_DURATION_SEC}-${MAX_DURATION_SEC}s)`,
    };
  }

  return { ok: true, size, durationSec };
}

function isNonAudioContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return (
    lower.includes("text/html") ||
    lower.includes("application/json") ||
    lower.includes("text/plain")
  );
}

function parseContentLength(header: string | null): number | null {
  if (!header) return null;
  const size = parseInt(header, 10);
  return Number.isFinite(size) && size > 0 ? size : null;
}

export async function fetchAudioBytes(
  url: string,
  maxBytes = MAX_DOWNLOAD_BYTES,
): Promise<{ ok: boolean; bytes?: Uint8Array; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ao baixar áudio` };
    }

    const contentLength = parseContentLength(res.headers.get("content-length"));
    if (contentLength !== null && contentLength > maxBytes) {
      return { ok: false, error: `Arquivo excede limite de download (${contentLength} bytes)` };
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      return { ok: false, error: `Arquivo excede limite de download (${buffer.byteLength} bytes)` };
    }

    return { ok: true, bytes: new Uint8Array(buffer) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, error: message };
  }
}

export async function validateAudioUrl(
  url: string,
): Promise<{ ok: boolean; size: number; durationSec?: number; error?: string }> {
  try {
    const headRes = await fetch(url, { method: "HEAD" });
    const contentType = headRes.headers.get("content-type");
    const contentLength = parseContentLength(headRes.headers.get("content-length"));

    if (!headRes.ok) {
      return { ok: false, size: 0, error: `HTTP ${headRes.status} ao acessar áudio` };
    }

    if (isNonAudioContentType(contentType)) {
      return { ok: false, size: contentLength ?? 0, error: `Content-Type inválido: ${contentType}` };
    }

    if (contentLength !== null && contentLength < MIN_MP3_BYTES) {
      return { ok: false, size: contentLength, error: `Arquivo muito pequeno (${contentLength} bytes)` };
    }

    const fetched = await fetchAudioBytes(url);
    if (!fetched.ok || !fetched.bytes) {
      return { ok: false, size: 0, error: fetched.error ?? "Falha ao baixar áudio" };
    }

    return validateAudioBytes(fetched.bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, size: 0, error: message };
  }
}

export function buildElevenLabsMusicUrl(baseUrl?: string): string {
  const url = new URL(baseUrl || "https://api.elevenlabs.io/v1/music");
  url.searchParams.set("output_format", ELEVENLABS_OUTPUT_FORMAT);
  return url.toString();
}

export async function invalidateMusicForPresente(
  supabase: SupabaseClient,
  presenteId: string,
): Promise<void> {
  await supabase.storage.from("musicas").remove([`${presenteId}.mp3`]).catch(() => {});

  await supabase
    .from("musicas")
    .update({
      status: "failed",
      url_audio: null,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("presente_id", presenteId);
}
