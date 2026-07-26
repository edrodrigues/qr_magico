import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const CORE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
const MAX_RAW_SIZE = 200 * 1024 * 1024;
const TIMEOUT_MS = 120_000;

export function useVideoCompressor() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (loaded || loading) return;
    if (typeof SharedArrayBuffer === "undefined") {
      setError("Seu navegador nao suporta compressao de video.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      setLoaded(true);
    } catch (err) {
      console.error("Failed to load ffmpeg.wasm:", err);
      setError("Falha ao carregar motor de compressao.");
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  const compressVideo = useCallback(
    async (file: File, onProgress?: (p: number) => void): Promise<File> => {
      if (file.size > MAX_RAW_SIZE) {
        throw new Error("Arquivo muito grande (max 200MB).");
      }

      if (!loaded || !ffmpegRef.current) {
        await load();
        if (!ffmpegRef.current?.loaded) {
          return file;
        }
      }

      const ffmpeg = ffmpegRef.current!;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      try {
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Compression timeout")), TIMEOUT_MS)
        );

        const execPromise = ffmpeg.exec([
          "-i", inputName,
          "-c:v", "libx264",
          "-crf", "28",
          "-preset", "fast",
          "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
          "-an",
          "-movflags", "+faststart",
          outputName,
        ]);

        await Promise.race([execPromise, timeout]);

        const data = await ffmpeg.readFile(outputName);
        const compressed = new Blob([data as BlobPart], { type: "video/mp4" });

        if (onProgress) onProgress(100);

        return new File([compressed], file.name.replace(/\.[^.]+$/, ".mp4"), {
          type: "video/mp4",
          lastModified: Date.now(),
        });
      } catch (err) {
        console.error("Compression failed, returning original:", err);
        return file;
      } finally {
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch {
          // ignore cleanup errors
        }
      }
    },
    [loaded, load]
  );

  return { loaded, loading, error, load, compressVideo };
}
