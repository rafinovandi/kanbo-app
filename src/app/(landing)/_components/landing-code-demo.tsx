"use client";

import { useEffect, useRef, useState } from "react";

import DescriptionCodeBlock from "@/components/common/description-code-block";

const CODE = `if (!session) {
  return redirect("/login");
}
return redirect("/dashboard");`;

// The highlighter is only fetched when the block is about to scroll into view; until then the plain code is shown.
export default function LandingCodeDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <p className="text-sm">
        After signing in, people land on a blank page. Send them to the
        dashboard instead:
      </p>
      {near ? (
        <DescriptionCodeBlock lang="ts" code={CODE} />
      ) : (
        <pre className="overflow-auto rounded-xl border border-input px-3 pt-12 pb-3 font-mono text-[13px] leading-relaxed">
          {CODE}
        </pre>
      )}
    </div>
  );
}
