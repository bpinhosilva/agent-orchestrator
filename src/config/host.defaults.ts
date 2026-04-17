export const DEV_DEFAULT_HOST = '0.0.0.0';
export const RUNTIME_DEFAULT_HOST = '127.0.0.1';

export function getDefaultHost(nodeEnv?: string): string {
  return nodeEnv === 'production' ? RUNTIME_DEFAULT_HOST : DEV_DEFAULT_HOST;
}
