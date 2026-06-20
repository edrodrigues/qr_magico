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
  nome_homenageado: "Samuel",
  nome_remetente: "Edmilson",
  ocasiao: "gratidao",
  data_inicio: "2015-12-15",
  descricao_relacao: "Filho, é uma satisfação e um privilégio ser seu pai. Você é um ótimo filho. Espero que continue sendo assim, inteligente, dedicado, esforçado, bom filho e um bom garoto. Nós te amamos!",
  estilo_musical: "pop",
  fotos: [],
  thumbnail_url: "",
  musicaUrl: null,
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
    videoBitrate: "8M",
    x264Preset: "medium",
    outputLocation,
    inputProps,
  });

  console.log(`\nDone! Video saved to: ${outputLocation}`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
