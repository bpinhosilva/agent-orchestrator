import React, { useMemo } from 'react';

interface InitialsAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const palette = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6d28d9',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, size = 40, className = '' }) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.[0] ?? 'U').toUpperCase();
  }, [name]);

  const bg = useMemo(() => palette[hashCode(name) % palette.length], [name]);

  return (
    <div
      role="img"
      aria-label={`${name} avatar`}
      className={`inline-flex items-center justify-center rounded-full text-white font-bold select-none shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
