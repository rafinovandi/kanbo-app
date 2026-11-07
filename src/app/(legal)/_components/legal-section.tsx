import type { ReactNode } from "react";

import { PAGE_TITLE_CLASS } from "@/constants/ui-constant";
import { LEGAL_LAST_UPDATED } from "@/constants/legal-constant";

// Page frame of a legal document: title, date and its sections.
export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
        <p className="text-[13px] text-muted-foreground">Last updated {LEGAL_LAST_UPDATED}</p>
      </header>
      {children}
    </article>
  );
}

// One numbered-free section: a heading and its paragraphs or lists.
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-[15px] leading-relaxed text-kb-text-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
