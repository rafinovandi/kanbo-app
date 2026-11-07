import assert from "node:assert/strict";
import { test } from "node:test";

import { getSafeRedirectPath } from "./safe-redirect.ts";

const APP_ORIGIN = "https://app.example";

test("keeps same-site paths, including query and hash", () => {
  assert.equal(getSafeRedirectPath("/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectPath("/invite/abc123"), "/invite/abc123");
  assert.equal(getSafeRedirectPath("/projects/1?filter=open#top"), "/projects/1?filter=open#top");
  assert.equal(getSafeRedirectPath("/%5Cevil.example"), "/%5Cevil.example");
});

test("rejects values that resolve to another origin", () => {
  const attacks = [
    "//evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "evil.example",
  ];
  for (const attack of attacks) {
    assert.equal(getSafeRedirectPath(attack), "/dashboard", JSON.stringify(attack));
  }
});

test("every accepted value stays on the app origin", () => {
  const inputs = ["/ok", "/a/../b", "/\\x", "//x", "/\t/x", "/%5Cx", "/a?next=//x", "/#//x"];
  for (const input of inputs) {
    const resolved = new URL(getSafeRedirectPath(input), APP_ORIGIN);
    assert.equal(resolved.origin, APP_ORIGIN, JSON.stringify(input));
  }
});

test("falls back for non-strings and empty values", () => {
  for (const input of [null, undefined, 42, {}, [], ""]) {
    assert.equal(getSafeRedirectPath(input), "/dashboard");
  }
});

test("uses the given fallback", () => {
  assert.equal(getSafeRedirectPath("//evil.example", "/login"), "/login");
});
