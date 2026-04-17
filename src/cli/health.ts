import * as http from 'http';

/**
 * Normalises a server bind address to a client-reachable hostname.
 * Wildcard addresses (0.0.0.0, ::, etc.) are mapped to loopback.
 * Raw IPv6 addresses are wrapped in brackets for use in URLs.
 */
export function resolveHealthHost(host: string): string {
  const wildcards = ['0.0.0.0', '::', '::0', ''];
  if (wildcards.includes(host)) return '127.0.0.1';
  // Bare IPv6 needs brackets for URL construction
  if (host.includes(':') && !host.startsWith('[')) return `[${host}]`;
  return host;
}

export interface HealthCheckResult {
  healthy: boolean;
  status?: number;
  body?: string;
  error?: string;
}

/**
 * Makes a single HTTP GET to /health on the given host:port.
 * Resolves to a result object rather than throwing so callers can decide
 * how to handle partial failures.
 */
export function httpHealthCheck(
  host: string,
  port: string,
  timeoutMs = 5000,
): Promise<HealthCheckResult> {
  return new Promise((resolve) => {
    const resolvedHost = resolveHealthHost(host);
    const url = new URL(`http://${resolvedHost}:${port}/health`);

    const req = http.request(url, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        resolve({
          healthy: res.statusCode === 200,
          status: res.statusCode,
          body,
        });
      });
    });

    req.on('error', (err: Error) => {
      resolve({ healthy: false, error: err.message });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.end();
  });
}

/**
 * Polls /health until it returns healthy or the deadline is reached.
 * Returns true if healthy, false if timed out.
 */
export async function waitForHealth(
  host: string,
  port: string,
  timeoutMs = 30000,
  pollIntervalMs = 1000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await httpHealthCheck(host, port, Math.min(2000, timeoutMs));
    if (result.healthy) return true;
    await new Promise<void>((r) => setTimeout(r, pollIntervalMs));
  }
  return false;
}
