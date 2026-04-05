import React from 'react';
import type { AgentAttributes } from '../api/agents';
import { BALANCED_ATTRIBUTES } from '../api/agents';

interface Preset {
  label: string;
  values: AgentAttributes;
}

const PRESETS: Preset[] = [
  { label: 'AI Optimized', values: { creativity: 3.0, strictness: 3.5 } },
  { label: 'Creative', values: { creativity: 4.5, strictness: 2.0 } },
  { label: 'Analyst', values: { creativity: 1.5, strictness: 4.5 } },
  { label: 'Assistant', values: { creativity: 3.0, strictness: 2.5 } },
  { label: 'Strict Expert', values: { creativity: 2.0, strictness: 5.0 } },
];

interface PersonalityMatrixProps {
  value: AgentAttributes;
  onChange: (value: AgentAttributes) => void;
  readonly?: boolean;
}

const ATTR_MIN = 1;
const ATTR_MAX = 5;
const ATTR_STEP = 0.01;

const formatValue = (v: number | undefined): string =>
  (v ?? BALANCED_ATTRIBUTES.creativity!).toFixed(2);

const PersonalityMatrix: React.FC<PersonalityMatrixProps> = ({
  value,
  onChange,
  readonly = false,
}) => {
  const creativity = value.creativity ?? BALANCED_ATTRIBUTES.creativity!;
  const strictness = value.strictness ?? BALANCED_ATTRIBUTES.strictness!;

  const handleCreativityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, creativity: parseFloat(e.target.value) });
  };

  const handleStrictnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, strictness: parseFloat(e.target.value) });
  };

  return (
    <section className="space-y-4">
      <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">
        Personality Matrix
      </label>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange({ ...preset.values })}
            disabled={readonly}
            aria-label={preset.label}
            className="text-[10px] px-2 py-0.5 rounded bg-surface-container-highest hover:bg-tertiary/20 hover:text-tertiary border border-outline/20 transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {/* Creativity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Creativity</span>
            <span
              data-testid="creativity-value"
              className="text-primary font-mono font-bold"
            >
              {formatValue(creativity)}
            </span>
          </div>
          <input
            type="range"
            min={ATTR_MIN}
            max={ATTR_MAX}
            step={ATTR_STEP}
            value={creativity}
            onChange={handleCreativityChange}
            disabled={readonly}
            aria-label="Creativity"
            aria-valuemin={ATTR_MIN}
            aria-valuemax={ATTR_MAX}
            aria-valuenow={creativity}
            className="w-full accent-primary h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Strictness Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Strictness</span>
            <span
              data-testid="strictness-value"
              className="text-secondary font-mono font-bold"
            >
              {formatValue(strictness)}
            </span>
          </div>
          <input
            type="range"
            min={ATTR_MIN}
            max={ATTR_MAX}
            step={ATTR_STEP}
            value={strictness}
            onChange={handleStrictnessChange}
            disabled={readonly}
            aria-label="Strictness"
            aria-valuemin={ATTR_MIN}
            aria-valuemax={ATTR_MAX}
            aria-valuenow={strictness}
            className="w-full accent-secondary h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </section>
  );
};

export default PersonalityMatrix;
