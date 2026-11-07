import { useEffect, useRef } from "react";

// Runs `fn` after `delay` ms without another call.
export default function useDebounce() {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return (fn: () => void, delay: number) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      fn();
      timeout.current = null;
    }, delay);
  };
}
