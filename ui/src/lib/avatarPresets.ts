export const AVATAR_PRESET_KEYS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
] as const;

export type AvatarPresetKey = (typeof AVATAR_PRESET_KEYS)[number];

export const DEFAULT_AVATAR_PRESET: AvatarPresetKey = AVATAR_PRESET_KEYS[0];

export const AVATAR_PRESETS = AVATAR_PRESET_KEYS.map((key, index) => ({
  key,
  label: `Avatar ${index + 1}`,
  src: `/avatar-presets/${key}.svg`,
}));

export function isAvatarPresetKey(
  value: string | null | undefined,
): value is AvatarPresetKey {
  return !!value && AVATAR_PRESET_KEYS.includes(value as AvatarPresetKey);
}

export function getAvatarPresetUrl(value: string | null | undefined): string {
  return `/avatar-presets/${
    isAvatarPresetKey(value) ? value : DEFAULT_AVATAR_PRESET
  }.svg`;
}
