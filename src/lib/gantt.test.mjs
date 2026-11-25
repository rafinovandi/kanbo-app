import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addDays,
  buildTimeline,
  diffDays,
  formatRange,
  getSpan,
  resolveDueDate,
  stepDueDate,
  toLocalDay,
} from "./gantt.ts";

test("adds and counts days across month ends", () => {
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(diffDays("2026-11-03", "2026-11-10"), 7);
});

test("reads a timestamp as a day in the given time zone", () => {
  assert.equal(
    toLocalDay("2026-11-24T20:30:00Z", "Asia/Jakarta"),
    "2026-11-25",
  );
  assert.equal(toLocalDay("2026-11-24T20:30:00Z", "UTC"), "2026-11-24");
  assert.equal(toLocalDay("2026-11-24T20:30:00Z", "Not/AZone"), "2026-11-24");
});

test("a bar is one day long without a usable due date", () => {
  assert.deepEqual(getSpan("2026-11-03", null), {
    start: "2026-11-03",
    end: "2026-11-03",
    hasDue: false,
  });
  assert.deepEqual(getSpan("2026-11-03", "2026-11-01"), {
    start: "2026-11-03",
    end: "2026-11-03",
    hasDue: false,
  });
  assert.deepEqual(getSpan("2026-11-03", "2026-11-10"), {
    start: "2026-11-03",
    end: "2026-11-10",
    hasDue: true,
  });
  assert.equal(getSpan("2026-11-03", "2026-11-03").hasDue, true);
});

test("labels the range of a task", () => {
  assert.equal(
    formatRange("2026-11-03", "2026-11-10"),
    "Nov 3 – Nov 10 · 8 days",
  );
  assert.equal(
    formatRange("2026-11-03", "2026-11-03"),
    "Nov 3 – Nov 3 · 1 day",
  );
  assert.equal(formatRange("2026-11-03", null), "Nov 3 · No due date");
});

test("the timeline starts on a Monday, covers every bar and today", () => {
  const timeline = buildTimeline(
    [{ start: "2026-11-10", end: "2026-11-20" }],
    "2026-11-25",
  );
  assert.equal(timeline.days[0].weekday, 1);
  assert.ok(timeline.days[0].iso <= "2026-11-08");
  assert.equal(timeline.days.at(-1).iso, "2026-12-01");
  assert.equal(timeline.days.filter((day) => day.isToday).length, 1);
  assert.deepEqual(
    timeline.months.map((month) => month.label),
    ["November 2026", "December 2026"],
  );
  assert.equal(
    timeline.months.reduce((sum, month) => sum + month.days, 0),
    timeline.days.length,
  );
});

test("the timeline shows today even when there are no tasks", () => {
  const timeline = buildTimeline([], "2026-11-25");
  assert.ok(timeline.days.some((day) => day.iso === "2026-11-25"));
});

test("dragging the end back to the created day means no due date", () => {
  const base = { created: "2026-11-10", today: "2026-11-25" };
  assert.equal(resolveDueDate({ ...base, candidate: "2026-11-10" }), null);
  assert.equal(resolveDueDate({ ...base, candidate: "2026-11-05" }), null);
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-11-25" }),
    "2026-11-25",
  );
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-12-02" }),
    "2026-12-02",
  );
});

test("lengthening an overdue task, or one created in the past, snaps to today instead of clearing it", () => {
  const base = { created: "2026-11-06", today: "2026-11-26" };
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-11-15" }),
    "2026-11-26",
  );
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-11-07" }),
    "2026-11-26",
  );
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-11-28" }),
    "2026-11-28",
  );
});

test("a task created today gets no due date when its end is dragged back to today", () => {
  const base = { created: "2026-11-25", today: "2026-11-25" };
  assert.equal(resolveDueDate({ ...base, candidate: "2026-11-25" }), null);
  assert.equal(
    resolveDueDate({ ...base, candidate: "2026-11-26" }),
    "2026-11-26",
  );
});

test("keyboard steps move one day and fall back to no due date", () => {
  const base = { created: "2026-11-10", today: "2026-11-25" };
  assert.equal(
    stepDueDate({ ...base, current: "2026-11-26", direction: 1 }),
    "2026-11-27",
  );
  assert.equal(
    stepDueDate({ ...base, current: "2026-11-27", direction: -1 }),
    "2026-11-26",
  );
  assert.equal(
    stepDueDate({ ...base, current: "2026-11-25", direction: -1 }),
    null,
  );
  assert.equal(
    stepDueDate({ ...base, current: null, direction: 1 }),
    "2026-11-25",
  );
  assert.equal(stepDueDate({ ...base, current: null, direction: -1 }), null);
  assert.equal(
    stepDueDate({
      created: "2026-11-25",
      today: "2026-11-25",
      current: null,
      direction: 1,
    }),
    "2026-11-26",
  );
  assert.equal(
    stepDueDate({ ...base, current: "2026-11-14", direction: 1 }),
    "2026-11-25",
  );
  assert.equal(
    stepDueDate({ ...base, current: "2026-11-14", direction: -1 }),
    null,
  );
});
