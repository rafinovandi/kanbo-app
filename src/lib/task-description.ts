export type DescriptionBlock = { type: "text"; text: string } | { type: "code"; lang: string; code: string };

const FENCE = /^```(\w*)[ \t]*\n([\s\S]*?)\n?```[ \t]*$|```([^`\n]+)```/gm;

// Splits a description into paragraphs of text and code blocks: fenced (```lang … ```) or ```on one line```.
export function parseDescription(source: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let last = 0;
  for (const match of source.matchAll(FENCE)) {
    const before = source.slice(last, match.index).trim();
    if (before) blocks.push({ type: "text", text: before });
    blocks.push(
      match[3] === undefined
        ? { type: "code", lang: match[1] || "text", code: match[2] }
        : { type: "code", lang: "text", code: match[3] },
    );
    last = match.index + match[0].length;
  }
  const rest = source.slice(last).trim();
  if (rest) blocks.push({ type: "text", text: rest });
  return blocks;
}

const CODE_START = /^\s*((import|export|const|let|var|function|def|class|SELECT|npm|git)\b|\$\s|<[a-zA-Z!/])/i;

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
  if (/^[[{][\s\S]*[\]}]$/.test(trimmed) && /"[^"]*"\s*:/.test(trimmed)) return "json";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i.test(trimmed)) return "sql";
  if (/^\s*(\$\s|(npm|npx|git|cd|ls|curl|sudo)\s|#!\/)/.test(trimmed) && !/[{};]/.test(trimmed.split("\n")[0]))
    return "bash";
  if (/^\s*(def |class \w+(\(.*\))?:|import \w+$|from \w+ import)/m.test(trimmed)) return "python";
  if (/<\/?[a-zA-Z][\w-]*[^>]*>/.test(trimmed))
    return /(import |export |=>|className=|useState)/.test(trimmed) ? "tsx" : "html";
  if (/^[\s\S]*\{[\s\S]*[\w-]+\s*:\s*[^;]+;[\s\S]*\}/.test(trimmed) && !/(const|let|function|=>)/.test(trimmed))
    return "css";
  if (/(:\s*(string|number|boolean|void|any)\b|interface \w+|type \w+ =|as const)/.test(trimmed)) return "ts";
  return "js";
}

// ```lang … ``` around `code`, on its own lines.
export const toFence = (code: string, lang: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

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
  const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const tail = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
  const fenced = toFence(selected, lang);
  const cursor = before.length + lead.length + `\`\`\`${lang}\n`.length + selected.length;
  return { value: before + lead + fenced + tail + after, cursor };
}

export type InlineMarker = "**" | "*" | "~~";
export type InlineToken =
  { type: "text"; text: string } | { type: "bold" | "italic" | "strike"; children: InlineToken[] };

const INLINE =
  /\*\*\*(?!\s)([^\n]+?)(?<!\s)\*\*\*|\*\*(?!\s)([^\n]+?)(?<!\s)\*\*|~~(?!\s)([^\n]+?)(?<!\s)~~|\*(?!\s)([^*\n]+?)(?<!\s)\*/g;

// Splits text into plain parts and **bold**, *italic* and ~~strikethrough~~ parts (nesting allowed). A marker must
// touch its text, so "2 * 3 * 4" stays as it is.
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) tokens.push({ type: "text", text: text.slice(last, match.index) });
    if (match[1] !== undefined)
      tokens.push({ type: "bold", children: [{ type: "italic", children: parseInline(match[1]) }] });
    else if (match[2] !== undefined) tokens.push({ type: "bold", children: parseInline(match[2]) });
    else if (match[3] !== undefined) tokens.push({ type: "strike", children: parseInline(match[3]) });
    else tokens.push({ type: "italic", children: parseInline(match[4]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
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
  for (let i = from; i >= 0 && i < value.length && value[i] === char; i += step) count++;
  return count;
}

// Whether the selection is already inside `marker` (one star is italic, two bold, three both).
export function hasInlineMarker(value: string, start: number, end: number, marker: InlineMarker): boolean {
  const { from, to } = trimSelection(value, start, end);
  if (from >= to) return false;
  if (marker === "~~") return value.slice(from - 2, from) === "~~" && value.slice(to, to + 2) === "~~";
  const around = Math.min(runLength(value, from - 1, -1, "*"), runLength(value, to, 1, "*"));
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
      value: value.slice(0, from - size) + value.slice(from, to) + value.slice(to + size),
      start: from - size,
      end: to - size,
    };
  }
  return {
    value: value.slice(0, from) + marker + value.slice(from, to) + marker + value.slice(to),
    start: from + size,
    end: to + size,
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
export function getTextareaCaretPosition(textarea: HTMLTextAreaElement, index: number) {
  const mirror = document.createElement("div");
  const style = getComputedStyle(textarea);
  for (const property of MIRRORED_STYLES) mirror.style[property] = style[property];
  Object.assign(mirror.style, { position: "absolute", visibility: "hidden", top: "0", left: "-9999px" });
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "anywhere";
  mirror.textContent = textarea.value.slice(0, index);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(index) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const position = { top: marker.offsetTop - textarea.scrollTop, left: marker.offsetLeft };
  document.body.removeChild(mirror);
  return position;
}
