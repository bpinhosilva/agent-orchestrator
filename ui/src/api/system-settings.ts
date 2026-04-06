import client from './client';

export interface SystemSettings {
  id?: string;
  data: {
    taskScheduler: {
      pollIntervalInMs: number;
      maxTaskPerExecution: number;
    };
    recurrentTasksScheduler: {
      pollIntervalInMs: number;
      executionTimeout: number;
      maxActiveTasks: number;
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
