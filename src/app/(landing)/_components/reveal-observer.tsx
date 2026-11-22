"use client";

import { useEffect } from "react";

// Marks each .kb-reveal and .kb-words block as shown (.is-in) the first time it scrolls into view, and never again.
// Blocks above the viewport on load (a refresh halfway down) are marked at once, so they are not left hidden.
export default function RevealObserver() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const blocks = [...document.querySelectorAll(".kb-reveal, .kb-words")];
    root.classList.add("kb-js");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.top >= 0)
            continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    blocks.forEach((block) => observer.observe(block));

    return () => {
      observer.disconnect();
      root.classList.remove("kb-js");
      blocks.forEach((block) => block.classList.remove("is-in"));
    };
  }, []);

  return null;
}
