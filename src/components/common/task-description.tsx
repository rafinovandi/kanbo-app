"use client";

import { Code1 } from "iconsax-react";
import { useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";

import DescriptionCodeBlock from "@/components/common/description-code-block";
import DescriptionFormatToolbar from "@/components/common/description-format-toolbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  detectLanguage,
  getTextareaCaretPosition,
  bulletize,
  continueList,
  hasInlineMarker,
  indentEmptyItem,
  insertCodeBlock,
  looksLikeCode,
  parseDescription,
  parseInline,
  parseText,
  toggleInlineMarker,
  type InlineMarker,
  type InlineToken,
} from "@/lib/task-description";
import { cn } from "@/lib/utils";
import { TASK_LIMITS } from "@/validations/task";

const PLACEHOLDER = "Type a description here…";
const TEXT_CLASS = "text-sm leading-[1.7] text-kb-text-2";
const TOOLBAR_HALF_WIDTH = 60;
const SHORTCUTS: Record<string, InlineMarker> = { b: "**", i: "*", x: "~~" };

function renderInline(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((token, index) => {
    if (token.type === "text") return token.text;
    const children = renderInline(token.children);
    if (token.type === "bold") return <strong key={index}>{children}</strong>;
    if (token.type === "italic") return <em key={index}>{children}</em>;
    return <s key={index}>{children}</s>;
  });
}

function renderText(text: string): ReactNode[] {
  return parseText(text).map((block, index) => {
    if (block.type === "heading") {
      const Heading = block.level === 1 ? "h2" : "h3";
      return (
        <Heading
          key={index}
          className={cn("font-semibold text-foreground", block.level === 1 ? "text-xl leading-snug" : "text-base")}
        >
          {renderInline(parseInline(block.text))}
        </Heading>
      );
    }
    if (block.type === "paragraph") {
      return (
        <p key={index} className="whitespace-pre-wrap">
          {renderInline(parseInline(block.text))}
        </p>
      );
    }
    const List = block.ordered ? "ol" : "ul";
    return (
      <List
        key={index}
        start={block.ordered ? block.start : undefined}
        className={cn("flex flex-col gap-1 pl-5 marker:text-muted-foreground", block.ordered ? "list-decimal" : "list-disc")}
      >
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>
            {renderInline(parseInline(item.text))}
            {item.description && (
              <span className="block whitespace-pre-wrap text-muted-foreground">
                {renderInline(parseInline(item.description))}
              </span>
            )}
          </li>
        ))}
      </List>
    );
  });
}

const FOCUS_CLASS = "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

// The description of a task, used by Add Task and the task modal. The text lives in the parent (`value`/`onChange`).
// With `alwaysEditing` it is a plain field that goes out with its form (`name`); otherwise it shows text and code
// blocks, and clicking the text starts editing (`onEditStart`). Pasted code and the Code Block button turn into
// fenced blocks; selected text can be made **bold**, *italic* or ~~struck through~~ (Markdown markers in the text).
// Remount it (`key`) to go back to the view.
export default function TaskDescription({
  value,
  onChange,
  name,
  invalid,
  alwaysEditing,
  onEditStart,
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  invalid?: boolean;
  alwaysEditing?: boolean;
  onEditStart?: () => void;
}) {
  const [editingByClick, setEditingByClick] = useState(false);
  const editing = !!alwaysEditing || editingByClick;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursor = useRef<{ start: number; end: number } | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (cursor.current === null || !textareaRef.current) return;
    textareaRef.current.setSelectionRange(cursor.current.start, cursor.current.end);
    textareaRef.current.focus();
    cursor.current = null;
  }, [value]);

  const edit = () => {
    setEditingByClick(true);
    onEditStart?.();
  };

  const editAtEnd = () => {
    if (value && !value.endsWith("\n")) onChange(`${value}\n\n`);
    edit();
  };

  const apply = (next: { value: string; cursor: number }) => {
    cursor.current = { start: next.cursor, end: next.cursor };
    onChange(next.value);
  };

  const trackSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) return setSelection(null);
    const { selectionStart: start, selectionEnd: end } = textarea;
    const from = getTextareaCaretPosition(textarea, start);
    const to = getTextareaCaretPosition(textarea, end);
    const middle = from.top === to.top ? (from.left + to.left) / 2 : from.left;
    const left = Math.min(
      Math.max(middle, TOOLBAR_HALF_WIDTH),
      Math.max(textarea.clientWidth - TOOLBAR_HALF_WIDTH, TOOLBAR_HALF_WIDTH),
    );
    setSelection({ start, end, top: from.top - 44, left });
  };

  const format = (marker: InlineMarker) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const next = toggleInlineMarker(value, textarea.selectionStart, textarea.selectionEnd, marker);
    cursor.current = { start: next.start, end: next.end };
    onChange(next.value);
    requestAnimationFrame(trackSelection);
  };

  const addCodeBlock = () => {
    const { selectionStart, selectionEnd } = textareaRef.current ?? {
      selectionStart: value.length,
      selectionEnd: value.length,
    };
    apply(insertCodeBlock(value, selectionStart, selectionEnd));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (selectionStart === selectionEnd && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const next =
        event.key === "Enter"
          ? continueList(value, selectionStart, event.shiftKey)
          : event.key === "Tab" && !event.shiftKey
            ? indentEmptyItem(value, selectionStart)
            : null;
      if (next) {
        event.preventDefault();
        apply(next);
        return;
      }
    }
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const marker = SHORTCUTS[event.key.toLowerCase()];
    if (!marker || (marker === "~~" && !event.shiftKey) || (marker !== "~~" && event.shiftKey)) return;
    event.preventDefault();
    format(marker);
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!looksLikeCode(pasted)) return;
    event.preventDefault();
    const code = pasted.replace(/\n+$/, "");
    const { selectionStart, selectionEnd } = event.currentTarget;
    const merged = value.slice(0, selectionStart) + code + value.slice(selectionEnd);
    apply(insertCodeBlock(merged, selectionStart, selectionStart + code.length, detectLanguage(pasted)));
  };

  const editOnKey = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    edit();
  };

  const blocks = parseDescription(value);
  const hasText = blocks.some((block) => block.type === "text");

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex min-h-8 items-center gap-2">
        <label htmlFor="task-description" className="text-[15px] font-semibold">
          Description
        </label>
        {editing && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={addCodeBlock}>
            <Code1 size={16} variant="Linear" color="currentColor" aria-hidden />
            Code Block
          </Button>
        )}
      </div>

      <div className="relative min-h-[120px]">
        {editing && selection && (
          <DescriptionFormatToolbar
            top={selection.top}
            left={selection.left}
            active={{
              "**": hasInlineMarker(value, selection.start, selection.end, "**"),
              "*": hasInlineMarker(value, selection.start, selection.end, "*"),
              "~~": hasInlineMarker(value, selection.start, selection.end, "~~"),
            }}
            onFormat={format}
          />
        )}
        {editing ? (
          <Textarea
            ref={textareaRef}
            id="task-description"
            name={name}
            value={value}
            onChange={(event) => {
              const { value: typed, selectionStart } = event.target;
              const bullet = bulletize(value, typed, selectionStart);
              if (bullet) apply(bullet);
              else onChange(typed);
            }}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            onSelect={trackSelection}
            onBlur={() => setSelection(null)}
            onFocus={(event) => {
              if (!alwaysEditing) event.currentTarget.setSelectionRange(value.length, value.length);
            }}
            maxLength={TASK_LIMITS.description}
            placeholder={PLACEHOLDER}
            aria-invalid={invalid}
            autoFocus={!alwaysEditing}
            className={cn(
              "min-h-[120px] w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent md:text-sm",
              "[overflow-wrap:anywhere]",
              "resize-none",
              TEXT_CLASS,
            )}
          />
        ) : blocks.length === 0 ? (
          <button
            type="button"
            onClick={edit}
            className={cn("w-full text-left text-muted-foreground", FOCUS_CLASS, TEXT_CLASS)}
          >
            {PLACEHOLDER}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {blocks.map((block, index) =>
              block.type === "code" ? (
                <DescriptionCodeBlock key={index} lang={block.lang} code={block.code} />
              ) : (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={edit}
                  onKeyDown={editOnKey}
                  className={cn("flex cursor-text flex-col gap-2 [overflow-wrap:anywhere]", FOCUS_CLASS, TEXT_CLASS)}
                >
                  {renderText(block.text)}
                </div>
              ),
            )}
            <button
              type="button"
              onClick={editAtEnd}
              className={cn("min-h-8 w-full cursor-text text-left text-muted-foreground", FOCUS_CLASS, TEXT_CLASS)}
            >
              {hasText ? <span className="sr-only">Add more text</span> : "Add more text…"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
