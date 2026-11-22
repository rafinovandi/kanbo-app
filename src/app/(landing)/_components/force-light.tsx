"use client";

import { useEffect } from "react";

// The inline script takes the dark class off before the first paint (no flash); the effect keeps it off while the
// landing page is open and puts the saved theme back when the visitor goes on to the app.
const SCRIPT = `document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";`;

function savedThemeIsDark() {
  try {
    const saved = localStorage.getItem("theme");
    return (
      saved === "dark" ||
      (saved === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
    );
  } catch {
    return false;
  }
}

export default function ForceLight() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      const dark = savedThemeIsDark();
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
  }, []);

  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
