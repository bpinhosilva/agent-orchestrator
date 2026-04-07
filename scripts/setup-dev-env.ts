import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = path.resolve(__dirname, '../.env');
const SECRETS_TO_GENERATE = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;
const MIN_LENGTH = 32;

function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

function serializeEnvFile(original: string, updates: Map<string, string>): string {
  const lines = original.split('\n');
  const handled = new Set<string>();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return line;
    const key = trimmed.slice(0, eqIndex).trim();
    if (updates.has(key)) {
      handled.add(key);
      return `${key}=${updates.get(key)}`;
    }
    return line;
  });

  // Append any keys that were not already in the file
  for (const [key, value] of updates.entries()) {
    if (!handled.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  return updatedLines.join('\n');
}

function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

function main() {
  const ENV_EXAMPLE_FILE = path.resolve(__dirname, '../.env.example');
  const existingContent = fs.existsSync(ENV_FILE)
    ? fs.readFileSync(ENV_FILE, 'utf-8')
    : fs.existsSync(ENV_EXAMPLE_FILE)
      ? fs.readFileSync(ENV_EXAMPLE_FILE, 'utf-8')
      : '';

  const envMap = parseEnvFile(existingContent);
  const updates = new Map<string, string>();

  for (const key of SECRETS_TO_GENERATE) {
    const current = envMap.get(key) ?? '';
    if (current.length >= MIN_LENGTH) {
      console.log(`[setup-dev-env] ${key} already set — skipping`);
    } else {
      const secret = generateSecret();
      updates.set(key, secret);
      console.log(`[setup-dev-env] ${key} generated`);
    }
  }

  if (updates.size === 0) {
    return;
  }

  const updatedContent = serializeEnvFile(existingContent, updates);
  fs.writeFileSync(ENV_FILE, updatedContent, { encoding: 'utf-8', mode: 0o600 });
}

main();
