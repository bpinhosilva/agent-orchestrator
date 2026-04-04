import React, { useMemo, useState } from 'react';
import Avatar from 'react-avatar';
import { getAvatarPresetUrl } from '../lib/avatarPresets';

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  avatarUrl,
  alt,
  className = '',
  imageClassName = 'h-full w-full object-cover',
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolvedSrc = useMemo(() => {
    const nextSrc = avatarUrl || getAvatarPresetUrl(avatar);

    if (failedSrc === nextSrc) {
      return null;
    }

    return nextSrc;
  }, [avatar, avatarUrl, failedSrc]);

  return (
    <div className={className}>
      {resolvedSrc ? (
        <img
          key={resolvedSrc}
          src={resolvedSrc}
          alt={alt ?? `${name} avatar`}
          className={imageClassName}
          onError={() => setFailedSrc(resolvedSrc)}
        />
      ) : (
        <Avatar
          name={name || 'Agent'}
          round
          size="100%"
          maxInitials={2}
          textSizeRatio={2}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
