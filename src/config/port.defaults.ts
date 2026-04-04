export const DEV_DEFAULT_PORT = 3000;
export const RUNTIME_DEFAULT_PORT = 15789;

export function getDefaultPort(nodeEnv?: string): number {
  return nodeEnv === 'production' ? RUNTIME_DEFAULT_PORT : DEV_DEFAULT_PORT;
}
