// Turns the name an MCP client announces in its initialize handshake (for example "claude-code") into a name for people.
const KNOWN: [RegExp, string][] = [
  [/claude/i, "Claude"],
  [/codex/i, "Codex"],
  [/cursor/i, "Cursor"],
  [/gemini/i, "Gemini"],
  [/copilot/i, "Copilot"],
  [/windsurf/i, "Windsurf"],
];

export function displayClientName(raw: string | null | undefined): string | null {
  const name = raw?.trim();
  if (!name) return null;
  const known = KNOWN.find(([pattern]) => pattern.test(name));
  if (known) return known[1];
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 64);
}
