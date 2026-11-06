// Decorative preview in the Dashboard empty state (design: "Dashboard empty · Variant D").
// Classes are theme tokens (kb-* palette).

export const EMPTY_STAT_TILES = [
  { label: "To Do", dotClass: "bg-kb-gray" },
  { label: "In Progress", dotClass: "bg-kb-blue" },
  { label: "Done", dotClass: "bg-kb-green" },
];

// Skeleton "projects": tile + name + progress bar that fills and resets (6s loop).
// y = row offset in the 220×96 preview, bar = final fill (0..1), width = name bar width.
export const EMPTY_PROJECT_ROWS = [
  { y: 0, nameWidth: 90, bar: 0.545, delay: 0, fillClass: "fill-kb-blue" },
  { y: 48, nameWidth: 70, bar: 0.318, delay: 0.6, fillClass: "fill-kb-lilac" },
];
