import { useEffect, useState } from 'react';

const readStoredFlag = (key: string, defaultValue: boolean) => {
  try {
    const savedValue = window.localStorage.getItem(key);
    if (savedValue === null) {
      return defaultValue;
    }

    return savedValue === 'true';
  } catch {
    return defaultValue;
  }
};

export const usePersistentFlag = (key: string, defaultValue: boolean) => {
  const [value, setValue] = useState(() => readStoredFlag(key, defaultValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Ignore storage write failures and keep in-memory state.
    }
  }, [key, value]);

  return [value, setValue] as const;
};
