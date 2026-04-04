import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().optional(),
  DATABASE_URL: Joi.string().optional(),
  DB_TYPE: Joi.string().valid('postgres', 'sqlite').optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  GEMINI_API_KEY: Joi.string().optional(),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  DB_LOGGING: Joi.boolean().default(false),
  SERVE_STATIC_UI: Joi.boolean().default(true),
  CHECK_PENDING_MIGRATIONS_ON_STARTUP: Joi.boolean().default(false),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  ALLOWED_ORIGINS: Joi.string().optional(),
  SCHEDULER_ENABLED: Joi.boolean().default(true),
});
