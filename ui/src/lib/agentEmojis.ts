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

export const AGENT_EMOJI_OPTIONS = [
  { value: '🧠', label: 'Strategist', hint: 'Planning and reasoning' },
  { value: '🤖', label: 'Automator', hint: 'Execution-heavy flows' },
  { value: '🧪', label: 'Analyst', hint: 'Research and experiments' },
  { value: '🛠️', label: 'Builder', hint: 'Engineering tasks' },
  { value: '📊', label: 'Operator', hint: 'Metrics and reporting' },
  { value: '🔍', label: 'Investigator', hint: 'Debugging and review' },
  { value: '🧭', label: 'Navigator', hint: 'Coordination and routing' },
  { value: '📝', label: 'Writer', hint: 'Documentation and briefs' },
  { value: '⚙️', label: 'Optimizer', hint: 'Systems and tuning' },
  { value: '🚀', label: 'Launcher', hint: 'Delivery and rollout' },
] as const satisfies readonly {
  value: AgentEmojiValue;
  label: string;
  hint: string;
}[];

export const isAgentEmojiValue = (value: unknown): value is AgentEmojiValue =>
  typeof value === 'string' &&
  AGENT_EMOJI_VALUES.includes(value as AgentEmojiValue);

export const normalizeAgentEmoji = (
  value?: string | null,
): AgentEmojiValue => (isAgentEmojiValue(value) ? value : DEFAULT_AGENT_EMOJI);

export const getAgentEmojiOption = (value?: string | null) => {
  const normalizedValue = normalizeAgentEmoji(value);
  return (
    AGENT_EMOJI_OPTIONS.find((option) => option.value === normalizedValue) ??
    AGENT_EMOJI_OPTIONS[0]
  );
};
