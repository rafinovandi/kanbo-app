"use client";

import { Code1 } from "iconsax-react";
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

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
  parseLines,
  toBlockOffset,
  toggleInlineMarker,
  type InlineMarker,
  type InlineToken,
} from "@/lib/task-description";
import { cn } from "@/lib/utils";
import { TASK_LIMITS } from "@/validations/task";

const PLACEHOLDER = "Type a description here…";
const TEXT_CLASS = "text-sm leading-[1.7] text-kb-text-2";
const HEADING_CLASS = ["text-xl", "text-base"];
const TOOLBAR_HALF_WIDTH = 60;
const SHORTCUTS: Record<string, InlineMarker> = { b: "**", i: "*", x: "~~" };

function renderInline(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((token, index) => {
    if (token.type === "text") return token.text;
    if (token.type === "code")
      return (
        <code
          key={index}
          className="rounded-[6px] bg-kb-gray-tint px-1.5 py-0.5 font-mono text-[13px] text-foreground dark:bg-kb-line"
        >
          {token.text}
        </code>
      );
    const children = renderInline(token.children);
    if (token.type === "bold") return <strong key={index}>{children}</strong>;
    if (token.type === "italic") return <em key={index}>{children}</em>;
    return <s key={index}>{children}</s>;
  });
}

// The text node and offset under a point on screen (the standard call, or the older WebKit one).
function caretAtPoint(
  x: number,
  y: number,
): { node: Node; offset: number } | null {
  const doc = document as unknown as {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const position = doc.caretPositionFromPoint?.(x, y);
  if (position) return { node: position.offsetNode, offset: position.offset };
  const range = doc.caretRangeFromPoint?.(x, y);
  return range
    ? { node: range.startContainer, offset: range.startOffset }
    : null;
}

// The view of a text block. Every source line is one line here too (a blank line keeps its height), so the text barely
// jumps when it switches to the editor. Headings are larger here only; the editor keeps one size so the caret lines up.
function renderText(text: string): ReactNode[] {
  return parseLines(text).map((line, index) => {
    if (line.type === "blank")
      return (
        <div
          key={index}
          data-line={index}
          className="h-[1.7em]"
          aria-hidden="true"
        />
      );
    const inline = renderInline(parseInline(line.text));
    if (line.type === "heading") {
      return (
        <div
          key={index}
          data-line={index}
          role="heading"
          aria-level={line.marker.trim().length + 1}
          className={cn(
            "font-semibold text-foreground",
            HEADING_CLASS[line.marker.trim().length - 1],
          )}
        >
          {inline}
        </div>
      );
    }
    if (line.type === "item") {
      return (
        <div key={index} data-line={index} className="whitespace-pre-wrap">
          <span className="text-muted-foreground">
            {line.marker.replace(/^-/, "•")}
          </span>
          {inline}
        </div>
      );
    }
    if (line.type === "description") {
      return (
        <div
          key={index}
          data-line={index}
          className="whitespace-pre-wrap text-muted-foreground"
        >
          {line.marker}
          {inline}
        </div>
      );
    }
    return (
      <div key={index} data-line={index} className="whitespace-pre-wrap">
        {inline}
      </div>
    );
  });
}

// Markers stay in the text while editing (only dimmed) and nothing changes the width of a letter, so the visible text
// lines up with the transparent textarea on top of it. Bold is a thin stroke, inline code a tinted background.
const MARKER_CLASS = "text-kb-placeholder";
const INLINE_MARKS = { bold: "**", italic: "*", strike: "~~" } as const;

function renderPreviewInline(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((token, index) => {
    if (token.type === "text") return token.text;
    if (token.type === "code") {
      return (
        <Fragment key={index}>
          <span className={MARKER_CLASS}>`</span>
          <span className="rounded-[4px] bg-kb-gray-tint text-foreground dark:bg-kb-line">
            {token.text}
          </span>
          <span className={MARKER_CLASS}>`</span>
        </Fragment>
      );
    }
    const mark = (
      <span className={MARKER_CLASS}>{INLINE_MARKS[token.type]}</span>
    );
    const className =
      token.type === "bold"
        ? "text-foreground [-webkit-text-stroke:0.5px]"
        : token.type === "italic"
          ? "italic"
          : "line-through";
    return (
      <Fragment key={index}>
        {mark}
        <span className={className}>{renderPreviewInline(token.children)}</span>
        {mark}
      </Fragment>
    );
  });
}

function renderPreview(value: string): ReactNode[] {
  const source = value.split("\n");
  let inFence = false;
  return parseLines(value).map((line, index) => {
    const raw = source[index];
    const fence = raw.startsWith("```");
    const code = inFence || fence;
    if (fence && !/^```[^`\n]+```\s*$/.test(raw)) inFence = !inFence;

    let content: ReactNode;
    if (code) content = <span className="text-muted-foreground">{raw}</span>;
    else if (line.type === "heading")
      content = (
        <>
          <span className={MARKER_CLASS}>{line.marker}</span>
          <span className="text-foreground [-webkit-text-stroke:0.5px]">
            {renderPreviewInline(parseInline(line.text))}
          </span>
        </>
      );
    else if (line.type === "item")
      content = (
        <>
          <span className={MARKER_CLASS}>{line.marker}</span>
          {renderPreviewInline(parseInline(line.text))}
        </>
      );
    else if (line.type === "description")
      content = (
        <span className="text-muted-foreground">
          {line.marker}
          {renderPreviewInline(parseInline(line.text))}
        </span>
      );
    else content = renderPreviewInline(parseInline(line.text));

    return (
      <Fragment key={index}>
        {content}
        {index < source.length - 1 ? "\n" : null}
      </Fragment>
    );
  });
}

const FOCUS_CLASS =
  "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

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
  const clickCaret = useRef<number | null>(null);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (cursor.current === null || !textareaRef.current) return;
    textareaRef.current.setSelectionRange(
      cursor.current.start,
      cursor.current.end,
    );
    textareaRef.current.focus();
    cursor.current = null;
  }, [value]);

  // Focus without scrolling: the browser would scroll to the top of a long textarea, away from where you clicked.
  useLayoutEffect(() => {
    if (editingByClick && !alwaysEditing)
      textareaRef.current?.focus({ preventScroll: true });
  }, [editingByClick, alwaysEditing]);

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
    if (!textarea || textarea.selectionStart === textarea.selectionEnd)
      return setSelection(null);
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
    const next = toggleInlineMarker(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      marker,
    );
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
    if (
      selectionStart === selectionEnd &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
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
    if (
      !marker ||
      (marker === "~~" && !event.shiftKey) ||
      (marker !== "~~" && event.shiftKey)
    )
      return;
    event.preventDefault();
    format(marker);
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!looksLikeCode(pasted)) return;
    event.preventDefault();
    const code = pasted.replace(/\n+$/, "");
    const { selectionStart, selectionEnd } = event.currentTarget;
    const merged =
      value.slice(0, selectionStart) + code + value.slice(selectionEnd);
    apply(
      insertCodeBlock(
        merged,
        selectionStart,
        selectionStart + code.length,
        detectLanguage(pasted),
      ),
    );
  };

  const editAtClick = (
    event: MouseEvent<HTMLElement>,
    block: { text: string; start: number },
  ) => {
    if (window.getSelection()?.toString()) return;
    const point = caretAtPoint(event.clientX, event.clientY);
    const line = (
      point?.node instanceof Element ? point.node : point?.node.parentElement
    )?.closest<HTMLElement>("[data-line]");
    if (point && line) {
      const range = document.createRange();
      range.setStart(line, 0);
      range.setEnd(point.node, point.offset);
      clickCaret.current =
        block.start +
        toBlockOffset(
          block.text,
          Number(line.dataset.line),
          range.toString().length,
        );
    }
    edit();
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={addCodeBlock}
          >
            <Code1
              size={16}
              variant="Linear"
              color="currentColor"
              aria-hidden
            />
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
              "**": hasInlineMarker(
                value,
                selection.start,
                selection.end,
                "**",
              ),
              "*": hasInlineMarker(value, selection.start, selection.end, "*"),
              "~~": hasInlineMarker(
                value,
                selection.start,
                selection.end,
                "~~",
              ),
            }}
            onFormat={format}
          />
        )}
        {editing ? (
          <div className="relative">
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere]",
                TEXT_CLASS,
              )}
            >
              {renderPreview(value)}
            </div>
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
                if (!alwaysEditing) {
                  const at = clickCaret.current ?? value.length;
                  clickCaret.current = null;
                  event.currentTarget.setSelectionRange(at, at);
                }
              }}
              maxLength={TASK_LIMITS.description}
              placeholder={PLACEHOLDER}
              aria-invalid={invalid}
              className={cn(
                "min-h-[120px] w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent md:text-sm",
                "[overflow-wrap:anywhere]",
                "resize-none",
                TEXT_CLASS,
                "relative text-transparent caret-foreground",
              )}
            />
          </div>
        ) : blocks.length === 0 ? (
          <button
            type="button"
            onClick={edit}
            className={cn(
              "w-full text-left text-muted-foreground",
              FOCUS_CLASS,
              TEXT_CLASS,
            )}
          >
            {PLACEHOLDER}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {blocks.map((block, index) =>
              block.type === "code" ? (
                <DescriptionCodeBlock
                  key={index}
                  lang={block.lang}
                  code={block.code}
                />
              ) : (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => editAtClick(event, block)}
                  onKeyDown={editOnKey}
                  className={cn(
                    "flex cursor-text flex-col [overflow-wrap:anywhere]",
                    FOCUS_CLASS,
                    TEXT_CLASS,
                  )}
                >
                  {renderText(block.text)}
                </div>
              ),
            )}
            <button
              type="button"
              onClick={editAtEnd}
              className={cn(
                "min-h-8 w-full cursor-text text-left text-muted-foreground",
                FOCUS_CLASS,
                TEXT_CLASS,
              )}
            >
              {hasText ? (
                <span className="sr-only">Add more text</span>
              ) : (
                "Add more text…"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
