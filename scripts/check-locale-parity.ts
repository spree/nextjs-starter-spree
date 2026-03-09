/**
 * Checks that all locale JSON files have the same set of keys as en.json.
 * Run: npx tsx scripts/check-locale-parity.ts
 */
import fs from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.resolve(__dirname, "../messages");
const BASE_LOCALE = "en";

function getNestedKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const baseFile = path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`);
const baseMessages = JSON.parse(fs.readFileSync(baseFile, "utf-8"));
const baseKeys = new Set(getNestedKeys(baseMessages));

const localeFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith(".json") && f !== `${BASE_LOCALE}.json`);

let hasError = false;

for (const file of localeFiles) {
  const locale = file.replace(".json", "");
  const messages = JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, file), "utf-8"),
  );
  const localeKeys = new Set(getNestedKeys(messages));

  const missing = [...baseKeys].filter((k) => !localeKeys.has(k));
  const extra = [...localeKeys].filter((k) => !baseKeys.has(k));

  if (missing.length > 0) {
    console.error(`[${locale}] Missing ${missing.length} key(s):`);
    for (const k of missing) console.error(`  - ${k}`);
    hasError = true;
  }

  if (extra.length > 0) {
    console.error(`[${locale}] Extra ${extra.length} key(s):`);
    for (const k of extra) console.error(`  + ${k}`);
    hasError = true;
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`[${locale}] OK — all keys match ${BASE_LOCALE}.json`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log("\nAll locale files are in sync.");
}
