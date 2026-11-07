"use client";

import { CloseCircle, SearchNormal1 } from "iconsax-react";
import { useEffect, useRef, useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { useHydrated } from "@/hooks/use-hydrated";

// Search field with a ⌘K / Ctrl K shortcut that focuses it (My Tasks and Board, spec §6, §9). The key label depends on the
// platform, so it renders after hydration.
export default function TaskSearch({ onChange }: { onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasValue, setHasValue] = useState(false);
  const hydrated = useHydrated();
  const isMac = hydrated && /Mac|iPhone|iPad/.test(navigator.userAgent);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clear = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    setHasValue(false);
    onChange("");
    inputRef.current.focus();
  };

  return (
    <InputGroup className="w-[260px] max-w-full">
      <InputGroupAddon>
        <SearchNormal1 size={18} variant="Linear" color="currentColor" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          onChange(e.target.value);
        }}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        placeholder="Search tasks"
        aria-label="Search tasks"
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      />
      <InputGroupAddon align="inline-end">
        {hasValue ? (
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={clear}>
            <CloseCircle size={16} variant="Linear" color="currentColor" aria-hidden />
          </InputGroupButton>
        ) : (
          <Kbd>{isMac ? "⌘ K" : "Ctrl K"}</Kbd>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
