/**
 * Deploy Remotion Lambda site and optionally a new function.
 *
 * Prerequisites: AWS credentials in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 *
 * Usage:
 *   node scripts/deploy-remotion-lambda.mjs           # bundle + deploy site only
 *   node scripts/deploy-remotion-lambda.mjs --function # also deploy Lambda function (900s timeout)
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { rmSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

config({ path: resolve(root, ".env") });

const deployFunction = process.argv.includes("--function");
const siteName = process.env.REMOTION_SITE_NAME || "retrospectiva";
const lambdaTimeoutSec = Number(process.env.REMOTION_LAMBDA_TIMEOUT_SEC || "900");
const lambdaMemoryMb = Number(process.env.REMOTION_LAMBDA_MEMORY_MB || "2048");
const buildDir = resolve(root, "build");

function run(cmd, label) {
  console.log(`\n=== ${label} ===\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env });
}

if (existsSync(buildDir)) {
  console.log("Removing stale build/ folder...");
  rmSync(buildDir, { recursive: true, force: true });
}

run(
  "npx remotion bundle src/remotion/index.ts --out-dir build",
  "Bundling Remotion site (local cache)",
);

run(
  `npx remotion lambda sites create src/remotion/index.ts --site-name ${siteName}`,
  `Deploying site "${siteName}" to S3`,
);

if (deployFunction) {
  run(
    `npx remotion lambda functions deploy --timeout ${lambdaTimeoutSec} --memory ${lambdaMemoryMb}`,
    `Deploying Lambda function (timeout=${lambdaTimeoutSec}s, memory=${lambdaMemoryMb}MB)`,
  );
}

const expectedFunctionName = deployFunction
  ? `remotion-render-4-0-482-mem${lambdaMemoryMb}mb-disk2048mb-${lambdaTimeoutSec}sec`
  : (process.env.REMOTION_FUNCTION_NAME ||
    `remotion-render-4-0-482-mem${lambdaMemoryMb}mb-disk2048mb-${lambdaTimeoutSec}sec`);

console.log("\n=== Done ===");
console.log("Update Supabase Edge Function secrets:");
console.log(`  REMOTION_FUNCTION_NAME=${expectedFunctionName}`);
console.log(`  REMOTION_SERVE_URL=https://remotionlambda-useast1-gpi3r82b1m.s3.us-east-1.amazonaws.com/sites/${siteName}/index.html`);
console.log("  REMOTION_VERSION=4.0.482");
if (deployFunction) {
  console.log(`\nThen run:`);
  console.log(`  npx supabase secrets set REMOTION_FUNCTION_NAME=${expectedFunctionName}`);
  console.log(`  npx supabase functions deploy render-video get-download-url --use-api`);
}
