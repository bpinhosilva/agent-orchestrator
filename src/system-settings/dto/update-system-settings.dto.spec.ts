import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { UpdateSystemSettingsDto } from './update-system-settings.dto';

function flattenErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      messages.push(...flattenErrors(error.children));
    }
  }
  return messages;
}

function toDto(payload: unknown): UpdateSystemSettingsDto {
  return plainToInstance(UpdateSystemSettingsDto, payload);
}

async function getErrors(payload: unknown): Promise<string[]> {
  const errors = await validate(toDto(payload), { whitelist: true });
  return flattenErrors(errors);
}

describe('UpdateSystemSettingsDto', () => {
  const validPayload = {
    data: {
      taskScheduler: {
        pollIntervalInMs: 20000,
        maxTaskPerExecution: 5,
      },
      recurrentTasksScheduler: {
        pollIntervalInMs: 15000,
        executionTimeout: 120000,
        maxActiveTasks: 5,
      },
    },
  };

  const validRecurrent = {
    pollIntervalInMs: 15000,
    executionTimeout: 120000,
    maxActiveTasks: 5,
  };

  describe('valid payloads', () => {
    it('should pass with default-like values', async () => {
      expect(await getErrors(validPayload)).toHaveLength(0);
    });

    it('should pass with pollIntervalInMs exactly at the minimum (10000)', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 10000, maxTaskPerExecution: 5 },
          recurrentTasksScheduler: validRecurrent,
        },
      };
      expect(await getErrors(payload)).toHaveLength(0);
    });

    it('should pass with maxTaskPerExecution at lower bound (1)', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 20000, maxTaskPerExecution: 1 },
          recurrentTasksScheduler: validRecurrent,
        },
      };
      expect(await getErrors(payload)).toHaveLength(0);
    });

    it('should pass with maxTaskPerExecution at upper bound (15)', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 20000, maxTaskPerExecution: 15 },
          recurrentTasksScheduler: validRecurrent,
        },
      };
      expect(await getErrors(payload)).toHaveLength(0);
    });
  });

  describe('pollIntervalInMs', () => {
    it('should fail when pollIntervalInMs is below 10000', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 9999, maxTaskPerExecution: 5 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('pollIntervalInMs'))).toBe(true);
    });

    it('should fail when pollIntervalInMs is 0', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 0, maxTaskPerExecution: 5 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('pollIntervalInMs'))).toBe(true);
    });

    it('should fail when pollIntervalInMs is a float', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 15000.5, maxTaskPerExecution: 5 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('pollIntervalInMs'))).toBe(true);
    });

    it('should fail when pollIntervalInMs is missing', async () => {
      const payload = {
        data: { taskScheduler: { maxTaskPerExecution: 5 } },
      };
      const errors = await getErrors(payload);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('maxTaskPerExecution', () => {
    it('should fail when maxTaskPerExecution is 0 (below minimum)', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 20000, maxTaskPerExecution: 0 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('maxTaskPerExecution'))).toBe(true);
    });

    it('should fail when maxTaskPerExecution is 16 (above maximum)', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 20000, maxTaskPerExecution: 16 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('maxTaskPerExecution'))).toBe(true);
    });

    it('should fail when maxTaskPerExecution is a float', async () => {
      const payload = {
        data: {
          taskScheduler: { pollIntervalInMs: 20000, maxTaskPerExecution: 5.5 },
        },
      };
      const errors = await getErrors(payload);
      expect(errors.some((m) => m.includes('maxTaskPerExecution'))).toBe(true);
    });

    it('should fail when maxTaskPerExecution is missing', async () => {
      const payload = {
        data: { taskScheduler: { pollIntervalInMs: 20000 } },
      };
      const errors = await getErrors(payload);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('structural validation', () => {
    it('should fail when data is missing', async () => {
      expect(await getErrors({})).not.toHaveLength(0);
    });

    it('should fail when taskScheduler is missing', async () => {
      expect(await getErrors({ data: {} })).not.toHaveLength(0);
    });

    it('should fail when taskScheduler is not an object', async () => {
      expect(
        await getErrors({ data: { taskScheduler: 'invalid' } }),
      ).not.toHaveLength(0);
    });
  });

  describe('recurrentTasksScheduler', () => {
    const validTaskScheduler = {
      pollIntervalInMs: 20000,
      maxTaskPerExecution: 5,
    };

    describe('valid payloads', () => {
      it('should pass with pollIntervalInMs exactly at the minimum (15000)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 5,
            },
          },
        };
        expect(await getErrors(payload)).toHaveLength(0);
      });

      it('should pass with executionTimeout exactly at the minimum (60000)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 60000,
              maxActiveTasks: 5,
            },
          },
        };
        expect(await getErrors(payload)).toHaveLength(0);
      });

      it('should pass with maxActiveTasks at lower bound (1)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 1,
            },
          },
        };
        expect(await getErrors(payload)).toHaveLength(0);
      });

      it('should pass with maxActiveTasks at upper bound (5)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 5,
            },
          },
        };
        expect(await getErrors(payload)).toHaveLength(0);
      });
    });

    describe('pollIntervalInMs', () => {
      it('should fail when pollIntervalInMs is below 15000', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 14999,
              executionTimeout: 120000,
              maxActiveTasks: 5,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('pollIntervalInMs'))).toBe(true);
      });

      it('should fail when pollIntervalInMs is a float', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000.5,
              executionTimeout: 120000,
              maxActiveTasks: 5,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('pollIntervalInMs'))).toBe(true);
      });

      it('should fail when pollIntervalInMs is missing', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              executionTimeout: 120000,
              maxActiveTasks: 5,
            },
          },
        };
        expect(await getErrors(payload)).not.toHaveLength(0);
      });
    });

    describe('executionTimeout', () => {
      it('should fail when executionTimeout is below 60000', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 59999,
              maxActiveTasks: 5,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('executionTimeout'))).toBe(true);
      });

      it('should fail when executionTimeout is a float', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 90000.5,
              maxActiveTasks: 5,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('executionTimeout'))).toBe(true);
      });

      it('should fail when executionTimeout is missing', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              maxActiveTasks: 5,
            },
          },
        };
        expect(await getErrors(payload)).not.toHaveLength(0);
      });
    });

    describe('maxActiveTasks', () => {
      it('should fail when maxActiveTasks is 0 (below minimum)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 0,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('maxActiveTasks'))).toBe(true);
      });

      it('should fail when maxActiveTasks is 6 (above maximum)', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 6,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('maxActiveTasks'))).toBe(true);
      });

      it('should fail when maxActiveTasks is a float', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
              maxActiveTasks: 2.5,
            },
          },
        };
        const errors = await getErrors(payload);
        expect(errors.some((m) => m.includes('maxActiveTasks'))).toBe(true);
      });

      it('should fail when maxActiveTasks is missing', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: {
              pollIntervalInMs: 15000,
              executionTimeout: 120000,
            },
          },
        };
        expect(await getErrors(payload)).not.toHaveLength(0);
      });
    });

    describe('structural validation', () => {
      it('should fail when recurrentTasksScheduler is missing', async () => {
        const payload = { data: { taskScheduler: validTaskScheduler } };
        expect(await getErrors(payload)).not.toHaveLength(0);
      });

      it('should fail when recurrentTasksScheduler is not an object', async () => {
        const payload = {
          data: {
            taskScheduler: validTaskScheduler,
            recurrentTasksScheduler: 'invalid',
          },
        };
        expect(await getErrors(payload)).not.toHaveLength(0);
      });
    });
  });
});
