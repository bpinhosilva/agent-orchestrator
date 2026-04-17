import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AvatarPickerModal from '../AvatarPickerModal';
import type { AvatarPresetKey } from '../../lib/avatarPresets';

describe('AvatarPickerModal', () => {
  it('disables saving when the current avatar is already selected', () => {
    render(
      <AvatarPickerModal
        isOpen
        selectedAvatar="avatar-01"
        currentAvatar="avatar-01"
        isSaving={false}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /save avatar/i }),
    ).toBeDisabled();
  });

  it('lets the user pick another avatar and confirm it', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const Wrapper = () => {
      const [selectedAvatar, setSelectedAvatar] =
        useState<AvatarPresetKey>('avatar-01');

      return (
        <AvatarPickerModal
          isOpen
          selectedAvatar={selectedAvatar}
          currentAvatar="avatar-01"
          isSaving={false}
          onSelect={setSelectedAvatar}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      );
    };

    render(<Wrapper />);

    await user.click(screen.getByRole('button', { name: /avatar 2/i }));
    const saveButton = screen.getByRole('button', { name: /save avatar/i });

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
