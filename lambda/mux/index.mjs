import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { createWriteStream, existsSync, unlinkSync } from "fs";
import { readFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveFfmpegPath() {
  const candidates = [
    join(__dirname, "node_modules/@ffmpeg-installer/linux-x64/ffmpeg"),
    join(__dirname, "node_modules/@ffmpeg-installer/ffmpeg/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`ffmpeg not found. Checked: ${candidates.join(", ")}`);
}

async function downloadS3(s3, bucket, key, dest) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!res.Body) throw new Error(`S3 object empty: ${bucket}/${key}`);
  await pipeline(res.Body, createWriteStream(dest));
}

async function downloadUrl(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download audio (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFile } = await import("fs/promises");
  await writeFile(dest, buf);
}

function cleanup(paths) {
  for (const p of paths) {
    if (existsSync(p)) unlinkSync(p);
  }
}

export const handler = async (event) => {
  const bucket = event.bucket;
  const videoKey = event.videoKey;
  const audioUrl = event.audioUrl;
  const outputKey = event.outputKey || videoKey;

  if (!bucket || !videoKey || !audioUrl) {
    return { success: false, error: "Missing bucket, videoKey or audioUrl" };
  }

  const id = randomUUID();
  const videoPath = join(tmpdir(), `mux-${id}-video.mp4`);
  const audioPath = join(tmpdir(), `mux-${id}-audio.mp3`);
  const outPath = join(tmpdir(), `mux-${id}-out.mp4`);
  const s3 = new S3Client({});

  try {
    await downloadS3(s3, bucket, videoKey, videoPath);
    await downloadUrl(audioUrl, audioPath);

    await execFileAsync(resolveFfmpegPath(), [
      "-y",
      "-i", videoPath,
      "-i", audioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-shortest",
      outPath,
    ]);

    const body = await readFile(outPath);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: outputKey,
      Body: body,
      ContentType: "video/mp4",
    }));

    return { success: true, outputKey };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("mux failed:", message);
    return { success: false, error: message };
  } finally {
    cleanup([videoPath, audioPath, outPath]);
  }
};
