import {
  buildPersonalitySection,
  getCreativityDescriptor,
  getStrictnessDescriptor,
} from './personality.util';
import type { AgentAttributes } from './dto/agent-attributes.dto';

describe('buildPersonalitySection', () => {
  it('returns empty string when no attributes provided', () => {
    expect(buildPersonalitySection(null)).toBe('');
    expect(buildPersonalitySection(undefined)).toBe('');
    expect(buildPersonalitySection({})).toBe('');
  });

  it('includes PERSONALITY MATRIX header when attributes are present', () => {
    const result = buildPersonalitySection({
      creativity: 3.0,
      strictness: 3.5,
    });
    expect(result).toContain('[PERSONALITY MATRIX]');
  });

  it('includes creativity value formatted to 2 decimal places', () => {
    const result = buildPersonalitySection({ creativity: 3.0 });
    expect(result).toContain('Creativity: 3.00/5');
  });

  it('includes strictness value formatted to 2 decimal places', () => {
    const result = buildPersonalitySection({ strictness: 4.5 });
    expect(result).toContain('Strictness: 4.50/5');
  });

  it('omits creativity line when not provided', () => {
    const result = buildPersonalitySection({ strictness: 3.5 });
    expect(result).not.toContain('Creativity');
    expect(result).toContain('Strictness');
  });

  it('omits strictness line when not provided', () => {
    const result = buildPersonalitySection({ creativity: 3.0 });
    expect(result).not.toContain('Strictness');
    expect(result).toContain('Creativity');
  });

  it('includes behavioral descriptor in output', () => {
    const result = buildPersonalitySection({
      creativity: 3.0,
      strictness: 3.5,
    });
    expect(result.length).toBeGreaterThan(50);
    // Should contain meaningful text beyond just numbers
    const lines = result.split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(3); // header + 2 attribute lines
  });
});

describe('getCreativityDescriptor', () => {
  it('returns Analytical descriptor for value 1.0', () => {
    const { label } = getCreativityDescriptor(1.0);
    expect(label).toBe('Analytical');
  });

  it('returns Analytical descriptor for value 1.9', () => {
    const { label } = getCreativityDescriptor(1.9);
    expect(label).toBe('Analytical');
  });

  it('returns Conservative descriptor for value 2.0', () => {
    const { label } = getCreativityDescriptor(2.0);
    expect(label).toBe('Conservative');
  });

  it('returns Balanced descriptor for value 3.0', () => {
    const { label } = getCreativityDescriptor(3.0);
    expect(label).toBe('Balanced');
  });

  it('returns Inventive descriptor for value 4.0', () => {
    const { label } = getCreativityDescriptor(4.0);
    expect(label).toBe('Inventive');
  });

  it('returns Imaginative descriptor for value 5.0', () => {
    const { label } = getCreativityDescriptor(5.0);
    expect(label).toBe('Imaginative');
  });

  it('each descriptor includes non-empty directive text', () => {
    [1.0, 2.0, 3.0, 4.0, 5.0].forEach((v) => {
      const { directive } = getCreativityDescriptor(v);
      expect(directive.length).toBeGreaterThan(10);
    });
  });
});

describe('getStrictnessDescriptor', () => {
  it('returns Flexible descriptor for value 1.0', () => {
    const { label } = getStrictnessDescriptor(1.0);
    expect(label).toBe('Flexible');
  });

  it('returns Relaxed descriptor for value 2.0', () => {
    const { label } = getStrictnessDescriptor(2.0);
    expect(label).toBe('Relaxed');
  });

  it('returns Structured descriptor for value 3.0', () => {
    const { label } = getStrictnessDescriptor(3.0);
    expect(label).toBe('Structured');
  });

  it('returns Rigorous descriptor for value 4.0', () => {
    const { label } = getStrictnessDescriptor(4.0);
    expect(label).toBe('Rigorous');
  });

  it('returns Exacting descriptor for value 5.0', () => {
    const { label } = getStrictnessDescriptor(5.0);
    expect(label).toBe('Exacting');
  });

  it('each descriptor includes non-empty directive text', () => {
    [1.0, 2.0, 3.0, 4.0, 5.0].forEach((v) => {
      const { directive } = getStrictnessDescriptor(v);
      expect(directive.length).toBeGreaterThan(10);
    });
  });
});

describe('full personality section output', () => {
  it('produces meaningful content for balanced AI-optimized values', () => {
    const balanced: AgentAttributes = { creativity: 3.0, strictness: 3.5 };
    const result = buildPersonalitySection(balanced);

    expect(result).toContain('3.00/5');
    expect(result).toContain('3.50/5');
    expect(result).toContain('Balanced');
    expect(result).toContain('Structured');
  });

  it('produces correct descriptors for high-creativity, low-strictness agent', () => {
    const result = buildPersonalitySection({
      creativity: 4.5,
      strictness: 1.5,
    });
    expect(result).toContain('Inventive');
    expect(result).toContain('Flexible');
  });

  it('produces correct descriptors for low-creativity, high-strictness agent', () => {
    const result = buildPersonalitySection({
      creativity: 1.5,
      strictness: 4.8,
    });
    expect(result).toContain('Analytical');
    expect(result).toContain('Rigorous');
  });
});
