import { envValidationSchema } from './env.validation';

const validBaseEnv = {
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('envValidationSchema log rotation settings', () => {
  it('accepts strict positive integer strings for log rotation env vars', () => {
    const { error, value } = envValidationSchema.validate({
      ...validBaseEnv,
      LOG_ROTATION_MAX_SIZE_MB: '10',
      LOG_ROTATION_MAX_FILES: '4',
    }) as { error: unknown; value: Record<string, string> };

    expect(error).toBeUndefined();
    expect(value['LOG_ROTATION_MAX_SIZE_MB']).toBe('10');
    expect(value['LOG_ROTATION_MAX_FILES']).toBe('4');
  });

  it('rejects scientific notation for log rotation env vars', () => {
    const { error } = envValidationSchema.validate({
      ...validBaseEnv,
      LOG_ROTATION_MAX_SIZE_MB: '1e2',
      LOG_ROTATION_MAX_FILES: '4',
    });

    expect(error).toBeDefined();
  });

  it('rejects decimal values for log rotation env vars', () => {
    const { error } = envValidationSchema.validate({
      ...validBaseEnv,
      LOG_ROTATION_MAX_SIZE_MB: '1.5',
      LOG_ROTATION_MAX_FILES: '4',
    });

    expect(error).toBeDefined();
  });
});
