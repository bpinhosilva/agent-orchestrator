import { SupportedProvider, SUPPORTED_PROVIDERS } from '../types';

export function validatePort(port: string): string {
  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(
      `Invalid port "${port}". Expected an integer between 1 and 65535.`,
    );
  }
  return `${parsedPort}`;
}

export function isValidPostgresConnectionString(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
      url.hostname.length > 0 &&
      url.pathname.length > 1 // must have at least "/dbname"
    );
  } catch {
    return false;
  }
}

export function collectProviders(
  value: string,
  previous: string[] = [],
): string[] {
  return previous.concat(
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function normalizeProviders(values: string[] = []): SupportedProvider[] {
  const normalized = values.map((v) => v.trim().toLowerCase());
  const errors: string[] = [];
  const seen = new Set<string>();
  const result: SupportedProvider[] = [];
  for (const v of normalized) {
    if (!SUPPORTED_PROVIDERS.includes(v as SupportedProvider)) {
      errors.push(
        `"${v}" is not a supported provider. Valid: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    } else if (!seen.has(v)) {
      seen.add(v);
      result.push(v as SupportedProvider);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return result;
}
