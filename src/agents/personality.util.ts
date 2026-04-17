import type { AgentAttributes } from './dto/agent-attributes.dto';

export interface PersonalityDescriptor {
  label: string;
  directive: string;
}

export function getCreativityDescriptor(value: number): PersonalityDescriptor {
  if (value < 2.0) {
    return {
      label: 'Analytical',
      directive:
        'Prioritize verifiable facts and established methods. Avoid speculation, metaphors, or novel framings. Deliver direct, evidence-based answers.',
    };
  }
  if (value < 3.0) {
    return {
      label: 'Conservative',
      directive:
        'Stick to proven approaches and well-established patterns. Introduce creative elements only when they provide clear, demonstrable value.',
    };
  }
  if (value < 4.0) {
    return {
      label: 'Balanced',
      directive:
        'Mix analytical precision with creative insight. Use examples, analogies, and varied perspectives where they add clarity or engagement.',
    };
  }
  if (value < 5.0) {
    return {
      label: 'Inventive',
      directive:
        'Actively explore novel approaches and generate multiple perspectives. Use vivid analogies, thought experiments, and lateral thinking to enrich responses.',
    };
  }
  return {
    label: 'Imaginative',
    directive:
      'Embrace unconventional thinking and maximum creative exploration. Freely use thought experiments, metaphors, and imaginative reframings to inspire and surprise.',
  };
}

export function getStrictnessDescriptor(value: number): PersonalityDescriptor {
  if (value < 2.0) {
    return {
      label: 'Flexible',
      directive:
        'Adapt tone and structure freely to the context. Allow ambiguity, be conversational, and interpret requests generously.',
    };
  }
  if (value < 3.0) {
    return {
      label: 'Relaxed',
      directive:
        'Maintain a loose but coherent structure. Respond naturally and informally when appropriate; precision is secondary to clarity.',
    };
  }
  if (value < 4.0) {
    return {
      label: 'Structured',
      directive:
        'Organize all responses clearly and follow instructions precisely. Balance thoroughness with approachability.',
    };
  }
  if (value < 5.0) {
    return {
      label: 'Rigorous',
      directive:
        'Apply strict formatting and boundary adherence in every response. Minimize deviation from stated constraints; flag any ambiguities before proceeding.',
    };
  }
  return {
    label: 'Exacting',
    directive:
      'Enforce all rules and constraints absolutely. Use precise, formal language. Never deviate from defined parameters; reject or escalate any out-of-scope requests.',
  };
}

/**
 * Builds a concise, LLM-optimized personality section to be appended to the
 * agent's system prompt. Returns an empty string when no meaningful attributes
 * are present so callers can safely filter it out.
 */
export function buildPersonalitySection(
  attributes: AgentAttributes | null | undefined,
): string {
  if (!attributes) return '';

  const lines: string[] = [];

  if (attributes.creativity !== undefined) {
    const { label, directive } = getCreativityDescriptor(attributes.creativity);
    lines.push(
      `- Creativity: ${attributes.creativity.toFixed(2)}/5 (${label}) — ${directive}`,
    );
  }

  if (attributes.strictness !== undefined) {
    const { label, directive } = getStrictnessDescriptor(attributes.strictness);
    lines.push(
      `- Strictness: ${attributes.strictness.toFixed(2)}/5 (${label}) — ${directive}`,
    );
  }

  if (lines.length === 0) return '';

  return ['[PERSONALITY MATRIX]', ...lines].join('\n');
}
