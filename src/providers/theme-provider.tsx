"use client";

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

// Thin wrapper so the root layout (a Server Component) can mount next-themes.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
