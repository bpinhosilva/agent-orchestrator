export const AGENT_EMOJI_VALUES = [
  '🧠',
  '🤖',
  '🧪',
  '🛠️',
  '📊',
  '🔍',
  '🧭',
  '📝',
  '⚙️',
  '🚀',
] as const;

export type AgentEmojiValue = (typeof AGENT_EMOJI_VALUES)[number];

export const DEFAULT_AGENT_EMOJI: AgentEmojiValue = '🧠';

export const isAgentEmojiValue = (value: unknown): value is AgentEmojiValue =>
  typeof value === 'string' &&
  AGENT_EMOJI_VALUES.includes(value as AgentEmojiValue);

export const normalizeAgentEmoji = (value?: string | null): AgentEmojiValue =>
  isAgentEmojiValue(value) ? value : DEFAULT_AGENT_EMOJI;
