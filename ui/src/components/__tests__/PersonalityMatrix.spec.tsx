import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PersonalityMatrix from '../PersonalityMatrix';
import type { AgentAttributes } from '../../api/agents';

const BALANCED = { creativity: 3.0, strictness: 3.5 };

const Wrapper = ({
  initial = BALANCED,
  onChange = vi.fn(),
}: {
  initial?: AgentAttributes;
  onChange?: (v: AgentAttributes) => void;
}) => {
  const [value, setValue] = useState<AgentAttributes>(initial);
  const handleChange = (v: AgentAttributes) => {
    setValue(v);
    onChange(v);
  };
  return <PersonalityMatrix value={value} onChange={handleChange} />;
};

describe('PersonalityMatrix', () => {
  it('renders Creativity and Strictness labels', () => {
    render(<Wrapper />);
    expect(screen.getByText('Creativity')).toBeInTheDocument();
    expect(screen.getByText('Strictness')).toBeInTheDocument();
  });

  it('displays initial creativity value formatted to 2 decimal places', () => {
    render(<Wrapper initial={{ creativity: 3.0, strictness: 3.5 }} />);
    expect(screen.getByTestId('creativity-value')).toHaveTextContent('3.00');
  });

  it('displays initial strictness value formatted to 2 decimal places', () => {
    render(<Wrapper initial={{ creativity: 3.0, strictness: 3.5 }} />);
    expect(screen.getByTestId('strictness-value')).toHaveTextContent('3.50');
  });

  it('calls onChange when creativity slider changes', () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);

    const slider = screen.getByRole('slider', { name: /creativity/i });
    fireEvent.change(slider, { target: { value: '4.5' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ creativity: 4.5 }),
    );
  });

  it('calls onChange when strictness slider changes', () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);

    const slider = screen.getByRole('slider', { name: /strictness/i });
    fireEvent.change(slider, { target: { value: '2.0' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ strictness: 2.0 }),
    );
  });

  it('renders sliders with min=1 and max=5', () => {
    render(<Wrapper />);

    const sliders = screen.getAllByRole('slider');
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '5');
    }
  });

  it('renders sliders with step=0.01', () => {
    render(<Wrapper />);

    const sliders = screen.getAllByRole('slider');
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('step', '0.01');
    }
  });

  it('renders AI Optimized badge', () => {
    render(<Wrapper />);
    expect(
      screen.getByRole('button', { name: /ai optimized/i }),
    ).toBeInTheDocument();
  });

  it('clicking AI Optimized resets sliders to balanced defaults (creativity=3.00, strictness=3.50)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Wrapper initial={{ creativity: 1.5, strictness: 5.0 }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /ai optimized/i }));

    expect(onChange).toHaveBeenCalledWith({ creativity: 3.0, strictness: 3.5 });
  });

  it('renders all preset buttons', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /ai optimized/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creative/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyst/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /strict expert/i })).toBeInTheDocument();
  });

  it('clicking Creative preset sets creativity=4.50 strictness=2.00', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Wrapper initial={{ creativity: 1.0, strictness: 1.0 }} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /creative/i }));
    expect(onChange).toHaveBeenCalledWith({ creativity: 4.5, strictness: 2.0 });
  });

  it('clicking Analyst preset sets creativity=1.50 strictness=4.50', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Wrapper initial={{ creativity: 1.0, strictness: 1.0 }} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /analyst/i }));
    expect(onChange).toHaveBeenCalledWith({ creativity: 1.5, strictness: 4.5 });
  });

  it('clicking Assistant preset sets creativity=3.00 strictness=2.50', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Wrapper initial={{ creativity: 1.0, strictness: 1.0 }} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /assistant/i }));
    expect(onChange).toHaveBeenCalledWith({ creativity: 3.0, strictness: 2.5 });
  });

  it('clicking Strict Expert preset sets creativity=2.00 strictness=5.00', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Wrapper initial={{ creativity: 1.0, strictness: 1.0 }} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /strict expert/i }));
    expect(onChange).toHaveBeenCalledWith({ creativity: 2.0, strictness: 5.0 });
  });

  it('shows updated creativity value after slider interaction', () => {
    render(<Wrapper />);

    const slider = screen.getByRole('slider', { name: /creativity/i });
    fireEvent.change(slider, { target: { value: '4.75' } });

    expect(screen.getByTestId('creativity-value')).toHaveTextContent('4.75');
  });

  it('shows updated strictness value after slider interaction', () => {
    render(<Wrapper />);

    const slider = screen.getByRole('slider', { name: /strictness/i });
    fireEvent.change(slider, { target: { value: '1.25' } });

    expect(screen.getByTestId('strictness-value')).toHaveTextContent('1.25');
  });
});
