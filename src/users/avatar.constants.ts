import type { User } from './entities/user.entity';

export const USER_AVATAR_KEYS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
] as const;

export type UserAvatarKey = (typeof USER_AVATAR_KEYS)[number];

export const DEFAULT_USER_AVATAR: UserAvatarKey = USER_AVATAR_KEYS[0];

export type SerializedUser = Omit<User, 'password'> & {
  avatarUrl: string;
};

export function isUserAvatarKey(value: string): value is UserAvatarKey {
  return USER_AVATAR_KEYS.includes(value as UserAvatarKey);
}

export function normalizeUserAvatar(
  value: string | null | undefined,
): UserAvatarKey {
  return value && isUserAvatarKey(value) ? value : DEFAULT_USER_AVATAR;
}

export function buildUserAvatarUrl(value: string | null | undefined): string {
  return `/avatar-presets/${normalizeUserAvatar(value)}.svg`;
}

export function serializeUser(
  user: Omit<User, 'password'> | User,
): SerializedUser {
  const rest = Object.fromEntries(
    Object.entries(user).filter(([key]) => key !== 'password'),
  ) as Omit<User, 'password'>;

  return {
    ...rest,
    avatar: normalizeUserAvatar(rest.avatar),
    avatarUrl: buildUserAvatarUrl(rest.avatar),
  };
}
