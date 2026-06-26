import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(".env.local") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getFallbackProps() {
  return {
    id: "sample-001",
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
}

async function fetchPresenteData(presenteId, supabase) {
  const { data: presente, error: presenteErr } = await supabase
    .from("presentes")
    .select("*")
    .eq("id", presenteId)
    .single();

  if (presenteErr || !presente) {
    console.error(`Failed to fetch presente ${presenteId}:`, presenteErr?.message || "Not found");
    return null;
  }

  const { data: fotos, error: fotosErr } = await supabase
    .from("fotos")
    .select("url, ordem")
    .eq("presente_id", presenteId)
    .order("ordem", { ascending: true });

  if (fotosErr) {
    console.error(`Failed to fetch fotos for ${presenteId}:`, fotosErr.message);
  }

  const fotosUrls = (fotos || []).map((f) => f.url);

  const { data: musica } = await supabase
    .from("musicas")
    .select("url_audio")
    .eq("presente_id", presenteId)
    .maybeSingle();

  const musicaUrl = musica?.url_audio ?? null;

  console.log(`Fetched ${fotosUrls.length} photos for ${presenteId}`);
  if (fotosUrls.length > 0) {
    console.log("Photo URLs:", fotosUrls.map((u) => u.substring(u.lastIndexOf("/") + 1)));
  }
  console.log(`Music URL: ${musicaUrl ? "found" : "not found"}`);

  return {
    id: presente.id,
    nome_homenageado: presente.nome_homenageado,
    nome_remetente: presente.nome_remetente,
    ocasiao: presente.ocasiao,
    data_inicio: presente.data_inicio,
    descricao_relacao: presente.descricao_relacao,
    estilo_musical: presente.estilo_musical,
    fotos: fotosUrls,
    thumbnail_url: presente.thumbnail_url || "",
    musicaUrl,
    audioDurationInSeconds: 60,
  };
}

async function main() {
  const presenteId = process.argv[2];

  let inputProps;
  if (presenteId) {
    console.log(`Fetching data for presente_id: ${presenteId}`);
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
      process.exit(1);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    inputProps = await fetchPresenteData(presenteId, supabase);
    if (!inputProps) {
      console.error("Could not fetch presente data. Aborting.");
      process.exit(1);
    }
  } else {
    console.warn("No presente_id provided. Using hardcoded fallback data (no photos).");
    console.warn("Usage: node scripts/render-local.mjs <presente_id>");
    inputProps = getFallbackProps();
  }

  console.log("Input props:", JSON.stringify(inputProps, null, 2));

  console.log("Bundling Remotion entry point...");
  const bundleLocation = await bundle({
    entryPoint: resolve(root, "src/remotion/index.ts"),
    webpackOverride: (cfg) => cfg,
  });
  console.log(`Bundle at: ${bundleLocation}`);

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Retrospectiva",
    inputProps,
  });

  mkdirSync(resolve(root, "out"), { recursive: true });
  const safeName = inputProps.nome_homenageado.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "_");
  const outputLocation = resolve(root, "out", `${safeName}-${inputProps.id}.mp4`);

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
