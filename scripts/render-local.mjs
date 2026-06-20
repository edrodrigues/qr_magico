import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { config } from "dotenv";

config({ path: resolve(".env.local") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const inputProps = {
  nome_homenageado: "Rafaela",
  nome_remetente: "",
  ocasiao: "outro",
  data_inicio: "2026-06-14",
  descricao_relacao: "Parabens pela aprovacao no concurso. Muitas felicidades na sua nova fase em Brasilia.",
  estilo_musical: "mpb",
  fotos: [],
  thumbnail_url: "",
  musicaUrl: "",
};

async function main() {
  console.log("Input props:", JSON.stringify(inputProps, null, 2));

  console.log("Bundling Remotion entry point...");
  const bundleLocation = await bundle({
    entryPoint: resolve(root, "src/remotion/index.ts"),
    webpackOverride: (config) => config,
  });
  console.log(`Bundle at: ${bundleLocation}`);

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Retrospectiva",
    inputProps,
  });

  mkdirSync(resolve(root, "out"), { recursive: true });
  const outputLocation = resolve(root, "out", "rafaela.mp4");

  console.log(`Rendering to: ${outputLocation}`);
  console.log(`Duration: ${composition.durationInFrames} frames @ ${composition.fps}fps (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`);
  console.log("This may take 5-15 minutes...\n");

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  console.log(`\nDone! Video saved to: ${outputLocation}`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
