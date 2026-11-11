export type DescriptionBlock =
  | { type: "text"; text: string; start: number }
  | { type: "code"; lang: string; code: string };

const FENCE = /^```(\w*)[ \t]*\n([\s\S]*?)\n?```[ \t]*$|```([^`\n]+)```/gm;

// Splits a description into paragraphs of text and code blocks: fenced (```lang … ```) or ```on one line```.
export function parseDescription(source: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let last = 0;
  for (const match of source.matchAll(FENCE)) {
    const before = source.slice(last, match.index);
    if (before.trim())
      blocks.push({
        type: "text",
        text: before.trim(),
        start: last + before.length - before.trimStart().length,
      });
    blocks.push(
      match[3] === undefined
        ? { type: "code", lang: match[1] || "text", code: match[2] }
        : { type: "code", lang: "text", code: match[3] },
    );
    last = match.index + match[0].length;
  }
  const rest = source.slice(last);
  if (rest.trim())
    blocks.push({
      type: "text",
      text: rest.trim(),
      start: last + rest.length - rest.trimStart().length,
    });
  return blocks;
}

const CODE_START =
  /^\s*((import|export|const|let|var|function|def|class|SELECT|npm|git)\b|\$\s|<[a-zA-Z!/])/i;

// Pasted text counts as code with several lines and many code symbols, indented lines, or a code-like first line.
export function looksLikeCode(text: string): boolean {
  const lines = text.split("\n");
  if (CODE_START.test(lines[0])) return true;
  if (lines.length < 2) return false;
  if (lines.some((line) => /^( {2,}|\t)\S/.test(line))) return true;
  const symbols = (text.match(/[{}();=<>[\]]/g) ?? []).length;
  return lines.length >= 3 && symbols / text.length > 0.04;
}

export function detectLanguage(text: string): string {
  const trimmed = text.trim();
  if (/^[[{][\s\S]*[\]}]$/.test(trimmed) && /"[^"]*"\s*:/.test(trimmed))
    return "json";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i.test(trimmed))
    return "sql";
  if (
    /^\s*(\$\s|(npm|npx|git|cd|ls|curl|sudo)\s|#!\/)/.test(trimmed) &&
    !/[{};]/.test(trimmed.split("\n")[0])
  )
    return "bash";
  if (
    /^\s*(def |class \w+(\(.*\))?:|import \w+$|from \w+ import)/m.test(trimmed)
  )
    return "python";
  if (/<\/?[a-zA-Z][\w-]*[^>]*>/.test(trimmed))
    return /(import |export |=>|className=|useState)/.test(trimmed)
      ? "tsx"
      : "html";
  if (
    /^[\s\S]*\{[\s\S]*[\w-]+\s*:\s*[^;]+;[\s\S]*\}/.test(trimmed) &&
    !/(const|let|function|=>)/.test(trimmed)
  )
    return "css";
  if (
    /(:\s*(string|number|boolean|void|any)\b|interface \w+|type \w+ =|as const)/.test(
      trimmed,
    )
  )
    return "ts";
  return "js";
}

// ```lang … ``` around `code`, on its own lines.
export const toFence = (code: string, lang: string) =>
  `\`\`\`${lang}\n${code}\n\`\`\``;

// Puts a fenced block into `value` at the selection: an empty block at the cursor, or the selected text inside one.
export function insertCodeBlock(
  value: string,
  start: number,
  end: number,
  lang = "",
): { value: string; cursor: number } {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const lead =
    before && !before.endsWith("\n\n")
      ? before.endsWith("\n")
        ? "\n"
        : "\n\n"
      : "";
  const tail =
    after && !after.startsWith("\n\n")
      ? after.startsWith("\n")
        ? "\n"
        : "\n\n"
      : "";
  const fenced = toFence(selected, lang);
  const cursor =
    before.length + lead.length + `\`\`\`${lang}\n`.length + selected.length;
  return { value: before + lead + fenced + tail + after, cursor };
}

export type InlineMarker = "**" | "*" | "~~";
export type InlineToken =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "bold" | "italic" | "strike"; children: InlineToken[] };

const INLINE =
  /`([^`\n]+)`|\*\*\*(?!\s)([^\n]+?)(?<!\s)\*\*\*|\*\*(?!\s)([^\n]+?)(?<!\s)\*\*|~~(?!\s)([^\n]+?)(?<!\s)~~|\*(?!\s)([^*\n]+?)(?<!\s)\*/g;

// Splits text into plain parts and `code`, **bold**, *italic* and ~~strikethrough~~ parts (nesting allowed, code is
// literal). A marker must touch its text, so "2 * 3 * 4" stays as it is.
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last)
      tokens.push({ type: "text", text: text.slice(last, match.index) });
    if (match[1] !== undefined) tokens.push({ type: "code", text: match[1] });
    else if (match[2] !== undefined)
      tokens.push({
        type: "bold",
        children: [{ type: "italic", children: parseInline(match[2]) }],
      });
    else if (match[3] !== undefined)
      tokens.push({ type: "bold", children: parseInline(match[3]) });
    else if (match[4] !== undefined)
      tokens.push({ type: "strike", children: parseInline(match[4]) });
    else tokens.push({ type: "italic", children: parseInline(match[5]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
}

const INLINE_MARK_LENGTH = { code: 1, italic: 1, bold: 2, strike: 2 } as const;

// Where the caret goes in `text` (one line, with its Markdown markers) when it sits after `shown` visible
// characters of the rendered line: the markers are not visible, so they are skipped.
export function toRawOffset(text: string, shown: number): number {
  let raw = 0;
  let seen = 0;
  const take = (length: number) => {
    if (shown - seen <= length) {
      raw += shown - seen;
      return true;
    }
    seen += length;
    raw += length;
    return false;
  };
  const walk = (tokens: InlineToken[]): boolean => {
    for (const token of tokens) {
      if (token.type === "text") {
        if (take(token.text.length)) return true;
        continue;
      }
      const mark = INLINE_MARK_LENGTH[token.type];
      raw += mark;
      if (
        token.type === "code" ? take(token.text.length) : walk(token.children)
      )
        return true;
      raw += mark;
    }
    return false;
  };
  return walk(parseInline(text)) ? raw : text.length;
}

// The caret position in a text block (`text`) after `shown` visible characters of line `lineIndex`, as an offset in
// `text`. Headings hide their "#", so their visible text starts right after it.
export function toBlockOffset(
  text: string,
  lineIndex: number,
  shown: number,
): number {
  const lines = parseLines(text);
  const line = lines[Math.min(lineIndex, lines.length - 1)];
  let start = 0;
  for (let i = 0; i < lines.indexOf(line); i++)
    start += lines[i].marker.length + lines[i].text.length + 1;
  if (line.type === "blank") return start + Math.min(shown, line.text.length);
  if (line.type === "text") return start + toRawOffset(line.text, shown);
  const visible =
    line.type === "heading" ? shown : Math.max(shown - line.marker.length, 0);
  return start + line.marker.length + toRawOffset(line.text, visible);
}

// The selection without the spaces at its ends (a marker next to a space is not Markdown).
function trimSelection(value: string, start: number, end: number) {
  let from = start;
  let to = end;
  while (from < to && /\s/.test(value[from])) from++;
  while (to > from && /\s/.test(value[to - 1])) to--;
  return { from, to };
}

function runLength(value: string, from: number, step: 1 | -1, char: string) {
  let count = 0;
  for (let i = from; i >= 0 && i < value.length && value[i] === char; i += step)
    count++;
  return count;
}

// Whether the selection is already inside `marker` (one star is italic, two bold, three both).
export function hasInlineMarker(
  value: string,
  start: number,
  end: number,
  marker: InlineMarker,
): boolean {
  const { from, to } = trimSelection(value, start, end);
  if (from >= to) return false;
  if (marker === "~~")
    return (
      value.slice(from - 2, from) === "~~" && value.slice(to, to + 2) === "~~"
    );
  const around = Math.min(
    runLength(value, from - 1, -1, "*"),
    runLength(value, to, 1, "*"),
  );
  return marker === "**" ? around >= 2 : around % 2 === 1;
}

// Puts `marker` around the selection, or takes it off when it is already there. Returns the new text and selection.
export function toggleInlineMarker(
  value: string,
  start: number,
  end: number,
  marker: InlineMarker,
): { value: string; start: number; end: number } {
  const { from, to } = trimSelection(value, start, end);
  if (from >= to) return { value, start, end };
  const size = marker.length;

  if (hasInlineMarker(value, from, to, marker)) {
    return {
      value:
        value.slice(0, from - size) +
        value.slice(from, to) +
        value.slice(to + size),
      start: from - size,
      end: to - size,
    };
  }
  return {
    value:
      value.slice(0, from) +
      marker +
      value.slice(from, to) +
      marker +
      value.slice(to),
    start: from + size,
    end: to + size,
  };
}

export type TextLine = {
  type: "blank" | "heading" | "item" | "description" | "text";
  marker: string;
  text: string;
};

const HEADING = /^(#{1,2}) +(\S.*)$/;
const ITEM = /^(-|•|\d+\.) (.*)$/;
const DESCRIPTION = /^ {2,}\S/;

// Reads every line of a text block as a heading (# and ##), list item (- and 1.), item description (a line indented
// by two spaces or more under an item), blank or plain line. `marker + text` is always the original line, so the
// view and the live preview in the editor stay line for line the same.
export function parseLines(text: string): TextLine[] {
  let inList = false;
  return text.split("\n").map((line): TextLine => {
    const heading = HEADING.exec(line);
    if (heading) {
      inList = false;
      return {
        type: "heading",
        marker: line.slice(0, line.length - heading[2].length),
        text: heading[2],
      };
    }
    const item = ITEM.exec(line);
    if (item) {
      inList = true;
      return { type: "item", marker: `${item[1]} `, text: item[2] };
    }
    if (inList && DESCRIPTION.test(line)) {
      const body = line.trimStart();
      return {
        type: "description",
        marker: line.slice(0, line.length - body.length),
        text: body,
      };
    }
    inList = false;
    return line.trim()
      ? { type: "text", marker: "", text: line }
      : { type: "blank", marker: "", text: line };
  });
}

type Edit = { value: string; cursor: number };

const lineStart = (value: string, cursor: number) =>
  value.lastIndexOf("\n", cursor - 1) + 1;
const nextMarker = (marker: string) =>
  /\d/.test(marker) ? `${parseInt(marker, 10) + 1}. ` : `${marker} `;

// The list item a description line belongs to (the nearest line above that starts with - or 1.).
function itemAbove(value: string, start: number): RegExpExecArray | null {
  const lines = value.slice(0, Math.max(start - 1, 0)).split("\n");
  for (let i = lines.length - 1; i >= 0 && start > 0; i--) {
    const item = ITEM.exec(lines[i]);
    if (item) return item;
    if (!DESCRIPTION.test(lines[i])) return null;
  }
  return null;
}

// What Enter (or Shift+Enter) does on a list line, or null when the cursor is not at the end of one: a new item with
// the next number, a description line with Shift+Enter, and on an empty item the list ends.
export function continueList(
  value: string,
  cursor: number,
  shift: boolean,
): Edit | null {
  const start = lineStart(value, cursor);
  if (value.slice(cursor).split("\n")[0] !== "") return null;
  const line = value.slice(start, cursor);

  const item = ITEM.exec(line);
  if (item) {
    if (!item[2])
      return shift
        ? null
        : { value: value.slice(0, start) + value.slice(cursor), cursor: start };
    const insert = shift
      ? `\n${" ".repeat(item[1].length + 1)}`
      : `\n${nextMarker(item[1])}`;
    return {
      value: value.slice(0, cursor) + insert + value.slice(cursor),
      cursor: cursor + insert.length,
    };
  }

  if (/^ {2,}$/.test(line) || DESCRIPTION.test(line)) {
    const parent = itemAbove(value, start);
    if (!parent) return null;
    if (shift && line.trim()) {
      const insert = `\n${line.match(/^ */)![0]}`;
      return {
        value: value.slice(0, cursor) + insert + value.slice(cursor),
        cursor: cursor + insert.length,
      };
    }
    if (shift) return null;
    const marker = nextMarker(parent[1]);
    if (!line.trim())
      return {
        value: value.slice(0, start) + marker + value.slice(cursor),
        cursor: start + marker.length,
      };
    const insert = `\n${marker}`;
    return {
      value: value.slice(0, cursor) + insert + value.slice(cursor),
      cursor: cursor + insert.length,
    };
  }
  return null;
}

// Typing a space after "-" at the start of a line turns it into a "•" right away (so the dot shows while typing).
export function bulletize(
  previous: string,
  value: string,
  cursor: number,
): Edit | null {
  if (value.length <= previous.length) return null;
  const start = lineStart(value, cursor);
  if (value.slice(start, cursor) !== "- ") return null;
  return { value: `${value.slice(0, start)}• ${value.slice(cursor)}`, cursor };
}

// Tab on an empty item ("2. ") turns it into a description line of the item above.
export function indentEmptyItem(value: string, cursor: number): Edit | null {
  const start = lineStart(value, cursor);
  if (value.slice(cursor).split("\n")[0] !== "") return null;
  const item = ITEM.exec(value.slice(start, cursor));
  if (!item || item[2] || !itemAbove(value, start)) return null;
  const indent = " ".repeat(item[1].length + 1);
  return {
    value: value.slice(0, start) + indent + value.slice(cursor),
    cursor: start + indent.length,
  };
}

const MIRRORED_STYLES = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "textIndent",
  "tabSize",
] as const;

// Where character `index` of a textarea is, relative to the textarea's own box (measured with a hidden copy of it).
export function getTextareaCaretPosition(
  textarea: HTMLTextAreaElement,
  index: number,
) {
  const mirror = document.createElement("div");
  const style = getComputedStyle(textarea);
  for (const property of MIRRORED_STYLES)
    mirror.style[property] = style[property];
  Object.assign(mirror.style, {
    position: "absolute",
    visibility: "hidden",
    top: "0",
    left: "-9999px",
  });
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "anywhere";
  mirror.textContent = textarea.value.slice(0, index);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(index) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const position = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft,
  };
  document.body.removeChild(mirror);
  return position;
}
