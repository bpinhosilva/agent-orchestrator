import client from './client';

export interface SystemSettings {
  id?: string;
  data: {
    scheduler: {
      pollInterval: number;
      watchdogTimeout: number;
      queueFlushFrequency: number;
      heartbeatPeriod: number;
      retryBackoffMultiplier: string;
      maxExecutionWindow: number;
    };
    cluster: {
      broadcastFrequency: number;
      defaultLlmProvider: string;
      systemAliasId: string;
    };
    persistence: {
      retentionDays: number;
    };
    ui: {
      darkModeEnabled: boolean;
      primaryHexAccent: string;
    };
  };
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const { data } = await client.get('/system-settings');
  return data;
};

export const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
  const { data } = await client.patch('/system-settings', settings);
  return data;
};
