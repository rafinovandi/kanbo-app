import assert from "node:assert/strict";
import test from "node:test";

import { bulletize, continueList, indentEmptyItem, parseText } from "./task-description.ts";

test("parseText reads headings, lists and item descriptions", () => {
  const blocks = parseText("# Title\n## Sub\nintro\n- a\n- b\n\n1. one\n   about one\n2. two");
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["heading", "heading", "paragraph", "list", "list"],
  );
  assert.equal(blocks[0].level, 1);
  assert.equal(blocks[1].level, 2);
  assert.equal(blocks[3].ordered, false);
  assert.equal(blocks[4].ordered, true);
  assert.deepEqual(blocks[4].items, [
    { text: "one", description: "about one" },
    { text: "two", description: "" },
  ]);
});

test("parseText leaves '#' without a space and mid-line markers alone", () => {
  assert.deepEqual(parseText("#tag and 2 - 1"), [{ type: "paragraph", text: "#tag and 2 - 1" }]);
});

test("Enter on an item starts the next one", () => {
  assert.deepEqual(continueList("- a", 3, false), { value: "- a\n- ", cursor: 6 });
  assert.deepEqual(continueList("1. test", 7, false), { value: "1. test\n2. ", cursor: 11 });
});

test("Enter on an empty item ends the list", () => {
  assert.deepEqual(continueList("- a\n- ", 6, false), { value: "- a\n", cursor: 4 });
});

test("Shift+Enter adds a description line, Enter after it starts the next item", () => {
  const described = continueList("1. test", 7, true);
  assert.deepEqual(described, { value: "1. test\n   ", cursor: 11 });
  assert.deepEqual(continueList("1. test\n   more", 15, false), { value: "1. test\n   more\n2. ", cursor: 19 });
  assert.deepEqual(continueList("1. test\n   ", 11, false), { value: "1. test\n2. ", cursor: 11 });
});

test("Enter elsewhere is left to the browser", () => {
  assert.equal(continueList("plain", 5, false), null);
  assert.equal(continueList("- a b", 3, false), null);
});

test("Tab turns an empty item into a description line", () => {
  assert.deepEqual(indentEmptyItem("1. test\n2. ", 11), { value: "1. test\n   ", cursor: 11 });
  assert.equal(indentEmptyItem("2. ", 3), null);
});

test("a space after '-' at line start becomes a dot while typing", () => {
  assert.deepEqual(bulletize("", "- ", 2), { value: "• ", cursor: 2 });
  assert.deepEqual(bulletize("a\n-", "a\n- ", 4), { value: "a\n• ", cursor: 4 });
  assert.equal(bulletize("a -", "a - ", 4), null);
  assert.equal(bulletize("- x", "- ", 2), null);
});

test("dot items behave like dash items", () => {
  assert.deepEqual(continueList("• a", 3, false), { value: "• a\n• ", cursor: 6 });
  assert.equal(parseText("• a\n• b")[0].ordered, false);
});
