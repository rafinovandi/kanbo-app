"use client";

import { Code1 } from "iconsax-react";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";

// A fenced block of a task description: language name, copy button, numbered and highlighted lines.
export default function DescriptionCodeBlock({ lang, code }: { lang: string; code: string }) {
  const lines = useHighlightedCode(code, lang);

  return (
    <CodeBlock className="rounded-xl">
      <CodeBlockHeader>
        <CodeBlockTitle>
          <Code1 size={14} variant="Linear" color="currentColor" aria-hidden />
          {lang}
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers className="font-mono text-[13px]">
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}
