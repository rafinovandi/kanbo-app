"use client";

import { Moon, Sun1 } from "iconsax-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from "@/hooks/use-hydrated";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="size-10 rounded-[10px]">
          <Sun1
            size={20}
            variant="Linear"
            color="currentColor"
            aria-hidden
            className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          />
          <Moon
            size={20}
            variant="Linear"
            color="currentColor"
            aria-hidden
            className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={hydrated ? theme : undefined} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
