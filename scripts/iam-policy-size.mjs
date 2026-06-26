/**
 * Report IAM policy document size (non-whitespace chars).
 *
 * Usage:
 *   node scripts/iam-policy-size.mjs <policy.json> [policy2.json ...]
 *   npm run iam:policy-size -- infra/aws/mux-lambda-user-policy.json
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const INLINE_USER_LIMIT = 2048;
const MANAGED_POLICY_LIMIT = 6144;

function nonWhitespaceLength(text) {
  return text.replace(/\s/g, "").length;
}

function analyzeFile(filePath) {
  const absolute = resolve(filePath);
  const raw = readFileSync(absolute, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`${filePath}: JSON inválido — ${err.message}`);
    return null;
  }

  const compact = JSON.stringify(parsed);
  const nonWs = nonWhitespaceLength(compact);
  const statements = Array.isArray(parsed.Statement) ? parsed.Statement.length : 0;

  return {
    file: filePath,
    statements,
    charsWithWhitespace: raw.length,
    charsNonWhitespace: nonWs,
    inlineUserOk: nonWs <= INLINE_USER_LIMIT,
    managedOk: nonWs <= MANAGED_POLICY_LIMIT,
  };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Uso: node scripts/iam-policy-size.mjs <policy.json> [...]");
  process.exit(1);
}

const results = files.map(analyzeFile).filter(Boolean);
let combinedNonWs = 0;

for (const r of results) {
  combinedNonWs += r.charsNonWhitespace;
  console.log(`\n${r.file}`);
  console.log(`  Statements: ${r.statements}`);
  console.log(`  Chars (com espaços): ${r.charsWithWhitespace}`);
  console.log(`  Chars (sem espaços): ${r.charsNonWhitespace}`);
  console.log(`  Limite inline user (total): ${INLINE_USER_LIMIT} → ${r.inlineUserOk ? "OK sozinha" : "EXCEDE se for única inline"}`);
  console.log(`  Limite managed policy: ${MANAGED_POLICY_LIMIT} → ${r.managedOk ? "OK" : "EXCEDE"}`);
}

if (results.length > 1) {
  console.log(`\nSoma sem espaços (${results.length} arquivos): ${combinedNonWs}`);
  console.log(
    `  Cota inline user (todas inline juntas): ${INLINE_USER_LIMIT} → ${combinedNonWs <= INLINE_USER_LIMIT ? "OK" : "EXCEDE — use managed policy"}`,
  );
}
