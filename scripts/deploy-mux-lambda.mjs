/**
 * Deploy FFmpeg mux Lambda (video + audio → out.mp4).
 *
 * Usage:
 *   node scripts/deploy-mux-lambda.mjs              # update if exists; else instruct admin
 *   node scripts/deploy-mux-lambda.mjs --zip-only   # only build mux-lambda.zip
 *   node scripts/deploy-mux-lambda.mjs --allow-create  # try create-function (admin creds)
 */
import { execSync } from "child_process";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { existsSync, mkdirSync, rmSync, cpSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const muxDir = resolve(root, "lambda/mux");
const distDir = resolve(muxDir, "dist");
const setupDoc = resolve(root, "infra/aws/MUX_LAMBDA_SETUP.md");

config({ path: resolve(root, ".env") });

const args = new Set(process.argv.slice(2));
const zipOnly = args.has("--zip-only");
const allowCreate = args.has("--allow-create");

const region = process.env.AWS_REGION || "us-east-1";
const functionName = process.env.MUX_LAMBDA_FUNCTION_NAME || "qr-magico-mux-video-audio";
const roleArn = process.env.MUX_LAMBDA_ROLE_ARN || process.env.AWS_LAMBDA_ROLE_ARN || "";
const bucket = process.env.REMOTION_BUCKET_NAME || "remotionlambda-useast1-gpi3r82b1m";
const memory = process.env.MUX_LAMBDA_MEMORY_MB || "1024";
const timeout = process.env.MUX_LAMBDA_TIMEOUT_SEC || "120";

function run(cmd, label, cwd = root) {
  console.log(`\n=== ${label} ===\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd, env: process.env });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: "utf8", env: process.env, stdio: ["pipe", "pipe", "pipe"] });
}

function extractAccountId(arn) {
  const match = /^arn:aws:iam::(\d{12}):/.exec(arn || "");
  return match?.[1] || "ACCOUNT_ID";
}

function printAdminInstructions(zipPath) {
  const accountId = extractAccountId(roleArn);
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Mux Lambda ainda não existe — setup único pelo admin AWS       ║
╚══════════════════════════════════════════════════════════════════╝

O usuário remotion-user não tem lambda:CreateFunction (esperado).

1. Envie o zip ao admin: ${zipPath}

2. Admin cria a função no console AWS Lambda:
   - Nome: ${functionName}
   - Runtime: Node.js 20.x | Handler: index.handler
   - Role: ${roleArn || `arn:aws:iam::${accountId}:role/remotion-lambda-role`}
   - Timeout: ${timeout}s | Memory: ${memory} MB
   - Upload do zip acima

3. Admin cria customer-managed policy e anexa ao remotion-user:
   IAM → Policies → Create policy → JSON:
   → infra/aws/mux-lambda-user-policy.json
   Nome: qr-magico-mux-lambda-access
   Users → remotion-user → Attach policies directly (NÃO inline policy)
   Guia: infra/aws/MUX_LAMBDA_SETUP.md (passo 4)

4. Depois rode novamente:
   npm run remotion:deploy-mux

Guia completo: ${setupDoc}
`);
}

function isAccessDenied(err) {
  const text = String(err.stderr || err.stdout || err.message || "");
  return text.includes("AccessDenied") || text.includes("not authorized");
}

function buildZip() {
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });

  run("npm install --omit=dev", "Installing mux Lambda dependencies", muxDir);
  run(
    "npm install @ffmpeg-installer/linux-x64@4.1.0 --no-save --force --ignore-scripts",
    "Installing Linux ffmpeg binary for Lambda",
    muxDir,
  );
  cpSync(join(muxDir, "index.mjs"), join(distDir, "index.mjs"));
  cpSync(join(muxDir, "package.json"), join(distDir, "package.json"));
  cpSync(join(muxDir, "node_modules"), join(distDir, "node_modules"), { recursive: true });

  const zipPath = resolve(muxDir, "mux-lambda.zip");
  if (existsSync(zipPath)) rmSync(zipPath);

  const isWin = process.platform === "win32";
  if (isWin) {
    run(
      `powershell -Command "Compress-Archive -Path '${distDir.replace(/\\/g, "/")}/*' -DestinationPath '${zipPath.replace(/\\/g, "/")}' -Force"`,
      "Creating deployment zip",
    );
  } else {
    run(`cd "${distDir}" && zip -r "${zipPath}" .`, "Creating deployment zip");
  }

  return zipPath;
}

function functionExists() {
  try {
    execSync(`aws lambda get-function --function-name ${functionName} --region ${region}`, {
      stdio: "pipe",
      env: process.env,
    });
    return true;
  } catch {
    return false;
  }
}

function updateFunction(zipPath) {
  run(
    `aws lambda update-function-code --function-name ${functionName} --zip-file fileb://${zipPath} --region ${region}`,
    "Updating mux Lambda code",
  );
  try {
    run(
      `aws lambda update-function-configuration --function-name ${functionName} --timeout ${timeout} --memory-size ${memory} --region ${region}`,
      "Updating mux Lambda config",
    );
  } catch (err) {
    console.warn("Config update skipped (code deploy succeeded):", err.message || err);
  }
}

function createFunction(zipPath) {
  if (!roleArn) {
    console.error("MUX_LAMBDA_ROLE_ARN (or AWS_LAMBDA_ROLE_ARN) required to create the function.");
    process.exit(1);
  }
  const cmd =
    `aws lambda create-function --function-name ${functionName} --runtime nodejs20.x ` +
    `--handler index.handler --zip-file fileb://${zipPath} --role ${roleArn} ` +
    `--timeout ${timeout} --memory-size ${memory} --region ${region}`;
  run(cmd, "Creating mux Lambda");
}

const zipPath = buildZip();

if (zipOnly) {
  console.log(`\n=== Zip ready ===\n${zipPath}`);
  console.log("Envie ao admin AWS ou siga infra/aws/MUX_LAMBDA_SETUP.md");
  process.exit(0);
}

const exists = functionExists();

if (exists) {
  updateFunction(zipPath);
  console.log("\n=== Done ===");
  console.log(`Mux Lambda updated: ${functionName} (${region})`);
  console.log(`Supabase secret: MUX_LAMBDA_FUNCTION_NAME=${functionName}`);
  process.exit(0);
}

if (allowCreate) {
  try {
    createFunction(zipPath);
    console.log("\n=== Done ===");
    console.log(`Mux Lambda created: ${functionName} (${region})`);
    process.exit(0);
  } catch (err) {
    if (isAccessDenied(err)) {
      printAdminInstructions(zipPath);
      process.exit(1);
    }
    throw err;
  }
}

printAdminInstructions(zipPath);
process.exit(1);
