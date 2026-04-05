import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AgentEmojiPickerModal from '../AgentEmojiPickerModal';
import type { AgentEmojiValue } from '../../lib/agentEmojis';

describe('AgentEmojiPickerModal', () => {
  it('disables saving when the current emoji is already selected', () => {
    render(
      <AgentEmojiPickerModal
        isOpen
        selectedEmoji="🧠"
        currentEmoji="🧠"
        isSaving={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /save emoji/i }),
    ).toBeDisabled();
  });

  it('lets the user pick another emoji and confirm it', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const Wrapper = () => {
      const [selectedEmoji, setSelectedEmoji] = useState<AgentEmojiValue>('🧠');

      return (
        <AgentEmojiPickerModal
          isOpen
          selectedEmoji={selectedEmoji}
          currentEmoji="🧠"
          isSaving={false}
          onSelect={setSelectedEmoji}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      );
    };

    render(<Wrapper />);

    await user.click(
      screen.getByRole('button', { name: /automator emoji 🤖/i }),
    );
    const saveButton = screen.getByRole('button', { name: /save emoji/i });

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
