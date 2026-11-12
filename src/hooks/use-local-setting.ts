"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

// A string setting stored in this browser's localStorage, shared across components and tabs.
// `onChange` runs after a write (e.g. to set an attribute on <html>).
export function useLocalSetting<T extends string>(
  key: string,
  values: readonly T[],
  fallback: T,
  onChange?: (value: T) => void,
) {
  const read = useCallback((): T => {
    try {
      const stored = localStorage.getItem(key);
      return values.find((value) => value === stored) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, values, fallback]);

  const subscribe = useCallback(
    (listener: () => void) => {
      const set = listeners.get(key) ?? new Set<() => void>();
      set.add(listener);
      listeners.set(key, set);
      window.addEventListener("storage", listener);
      return () => {
        set.delete(listener);
        window.removeEventListener("storage", listener);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(subscribe, read, () => fallback);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {}
      onChange?.(next);
      listeners.get(key)?.forEach((listener) => listener());
    },
    [key, onChange],
  );

  return [value, setValue] as const;
}
