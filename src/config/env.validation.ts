import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().optional(),
  GEMINI_API_KEY: Joi.string().optional(),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
});
