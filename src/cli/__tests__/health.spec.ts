import { resolveHealthHost, httpHealthCheck, waitForHealth } from '../health';
import * as http from 'http';
import * as net from 'net';

describe('resolveHealthHost', () => {
  it.each([
    ['0.0.0.0', '127.0.0.1'],
    ['::', '127.0.0.1'],
    ['::0', '127.0.0.1'],
    ['', '127.0.0.1'],
    ['192.168.1.1', '192.168.1.1'],
    ['localhost', 'localhost'],
    ['::1', '[::1]'],
    ['2001:db8::1', '[2001:db8::1]'],
    ['[::1]', '[::1]'],
  ])('maps "%s" -> "%s"', (input, expected) => {
    expect(resolveHealthHost(input)).toBe(expected);
  });
});

describe('httpHealthCheck', () => {
  let server: http.Server;
  let port: string;

  afterEach(
    () =>
      new Promise<void>((resolve) => {
        if (server?.listening) server.close(() => resolve());
        else resolve();
      }),
  );

  function startEchoServer(statusCode: number, body: string): Promise<string> {
    return new Promise((resolve) => {
      server = http.createServer((_, res) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(body);
      });
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as net.AddressInfo;
        port = String(addr.port);
        resolve(port);
      });
    });
  }

  it('returns healthy=true for 200 response', async () => {
    await startEchoServer(200, '{"status":"ok"}');
    const result = await httpHealthCheck('127.0.0.1', port, 2000);
    expect(result.healthy).toBe(true);
    expect(result.status).toBe(200);
  });

  it('returns healthy=false for non-200 response', async () => {
    await startEchoServer(503, '{"error":"unavailable"}');
    const result = await httpHealthCheck('127.0.0.1', port, 2000);
    expect(result.healthy).toBe(false);
    expect(result.status).toBe(503);
  });

  it('returns healthy=false with error when connection is refused', async () => {
    // Use a port that is not listening
    const result = await httpHealthCheck('127.0.0.1', '1', 1000);
    expect(result.healthy).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('waitForHealth', () => {
  let server: http.Server;

  afterEach(
    () =>
      new Promise<void>((resolve) => {
        if (server?.listening) server.close(() => resolve());
        else resolve();
      }),
  );

  it('returns true when server becomes healthy within timeout', async () => {
    let callCount = 0;
    server = http.createServer((_, res) => {
      callCount++;
      if (callCount >= 2) {
        res.writeHead(200);
        res.end('{"status":"ok"}');
      } else {
        res.writeHead(503);
        res.end('');
      }
    });

    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const port = String((server.address() as net.AddressInfo).port);

    const result = await waitForHealth('127.0.0.1', port, 5000, 100);
    expect(result).toBe(true);
  });

  it('returns false if server never becomes healthy', async () => {
    // No server listening — all checks will fail with ECONNREFUSED
    const result = await waitForHealth('127.0.0.1', '1', 500, 100);
    expect(result).toBe(false);
  });
});
