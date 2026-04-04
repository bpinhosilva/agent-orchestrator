export const DEFAULT_PROVIDER_MODELS = [
  {
    providerName: 'google',
    models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash-image'],
  },
  {
    providerName: 'anthropic',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  },
] as const;

export const DEFAULT_MODEL_BY_PROVIDER = {
  google: DEFAULT_PROVIDER_MODELS[0].models[0],
  anthropic: DEFAULT_PROVIDER_MODELS[1].models[0],
} as const;
