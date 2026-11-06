import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false on the server and while this component hydrates, true right after (per component instance).
// Use it to delay browser-only branches (e.g. the mobile sidebar) until hydration is done, so the
// first client render matches the server HTML even when the component hydrates late (<Suspense>).
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
