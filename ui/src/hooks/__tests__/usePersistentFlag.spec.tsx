import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePersistentFlag } from '../usePersistentFlag';

const TestComponent = () => {
  const [enabled, setEnabled] = usePersistentFlag('feature-flag', true);

  return (
    <div>
      <span data-testid="value">{enabled ? 'true' : 'false'}</span>
      <button onClick={() => setEnabled(false)}>Disable</button>
    </div>
  );
};

describe('usePersistentFlag', () => {
  it('reads from storage once and persists updates', () => {
    window.localStorage.setItem('feature-flag', 'true');

    render(<TestComponent />);

    expect(screen.getByTestId('value')).toHaveTextContent('true');

    fireEvent.click(screen.getByText('Disable'));

    expect(screen.getByTestId('value')).toHaveTextContent('false');
    expect(window.localStorage.getItem('feature-flag')).toBe('false');
  });

  it('falls back to the provided default when storage is empty', () => {
    window.localStorage.removeItem('feature-flag');

    render(<TestComponent />);

    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });

  it('keeps the default when storage access throws', () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage blocked');
      });

    render(<TestComponent />);

    expect(screen.getByTestId('value')).toHaveTextContent('true');

    getItemSpy.mockRestore();
  });
});
