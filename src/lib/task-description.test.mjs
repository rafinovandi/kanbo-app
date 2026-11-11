import assert from "node:assert/strict";
import test from "node:test";

import {
  bulletize,
  continueList,
  indentEmptyItem,
  parseDescription,
  parseLines,
  toBlockOffset,
  toRawOffset,
} from "./task-description.ts";

test("parseLines reads headings, items, descriptions and blanks", () => {
  const lines = parseLines("# Title\n## Sub\nintro\n- a\n   about a\n\n1. one");
  assert.deepEqual(
    lines.map((line) => line.type),
    ["heading", "heading", "text", "item", "description", "blank", "item"],
  );
  assert.deepEqual(lines[0], { type: "heading", marker: "# ", text: "Title" });
  assert.deepEqual(lines[3], { type: "item", marker: "- ", text: "a" });
  assert.deepEqual(lines[4], {
    type: "description",
    marker: "   ",
    text: "about a",
  });
  assert.equal(lines[6].marker, "1. ");
});

test("parseLines leaves '#' without a space and mid-line markers alone", () => {
  assert.deepEqual(parseLines("#tag and 2 - 1"), [
    { type: "text", marker: "", text: "#tag and 2 - 1" },
  ]);
});

test("parseLines keeps every line so marker + text is the original", () => {
  const source = "# T\n- a\n   d\n\n  x";
  assert.equal(
    parseLines(source)
      .map((line) => line.marker + line.text)
      .join("\n"),
    source,
  );
});

test("Enter on an item starts the next one", () => {
  assert.deepEqual(continueList("- a", 3, false), {
    value: "- a\n- ",
    cursor: 6,
  });
  assert.deepEqual(continueList("1. test", 7, false), {
    value: "1. test\n2. ",
    cursor: 11,
  });
});

test("Enter on an empty item ends the list", () => {
  assert.deepEqual(continueList("- a\n- ", 6, false), {
    value: "- a\n",
    cursor: 4,
  });
});

test("Shift+Enter adds a description line, Enter after it starts the next item", () => {
  const described = continueList("1. test", 7, true);
  assert.deepEqual(described, { value: "1. test\n   ", cursor: 11 });
  assert.deepEqual(continueList("1. test\n   more", 15, false), {
    value: "1. test\n   more\n2. ",
    cursor: 19,
  });
  assert.deepEqual(continueList("1. test\n   ", 11, false), {
    value: "1. test\n2. ",
    cursor: 11,
  });
});

test("Enter elsewhere is left to the browser", () => {
  assert.equal(continueList("plain", 5, false), null);
  assert.equal(continueList("- a b", 3, false), null);
});

test("Tab turns an empty item into a description line", () => {
  assert.deepEqual(indentEmptyItem("1. test\n2. ", 11), {
    value: "1. test\n   ",
    cursor: 11,
  });
  assert.equal(indentEmptyItem("2. ", 3), null);
});

test("a space after '-' at line start becomes a dot while typing", () => {
  assert.deepEqual(bulletize("", "- ", 2), { value: "• ", cursor: 2 });
  assert.deepEqual(bulletize("a\n-", "a\n- ", 4), {
    value: "a\n• ",
    cursor: 4,
  });
  assert.equal(bulletize("a -", "a - ", 4), null);
  assert.equal(bulletize("- x", "- ", 2), null);
});

test("dot items behave like dash items", () => {
  assert.deepEqual(continueList("• a", 3, false), {
    value: "• a\n• ",
    cursor: 6,
  });
  assert.equal(parseLines("• a\n• b")[0].type, "item");
});

test("toRawOffset skips markers that are not visible", () => {
  assert.equal(toRawOffset("plain", 3), 3);
  assert.equal(toRawOffset("a **bold** b", 4), 6);
  assert.equal(toRawOffset("a `code` b", 3), 4);
  assert.equal(toRawOffset("a **bold** b", 99), 12);
});

test("toBlockOffset finds the caret in a block", () => {
  const text = "# Title\n- a **b**\n\nlast";
  assert.equal(toBlockOffset(text, 0, 3), 5);
  assert.equal(toBlockOffset(text, 1, 5), 8 + 2 + 2 + 3 - 1 + 1);
  assert.equal(toBlockOffset(text, 3, 2), text.length - 2);
});

test("parseDescription tells where a text block starts", () => {
  const source = "\n\n  intro\n```js\nx\n```\nend";
  const blocks = parseDescription(source);
  assert.equal(source.slice(blocks[0].start, blocks[0].start + 5), "intro");
  assert.equal(source.slice(blocks[2].start), "end");
});
