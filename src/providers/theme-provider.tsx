"use client";

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

// Same as website_cafe: thin wrapper so the root layout (a Server Component) can mount next-themes.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
