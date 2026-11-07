// Class strings shared by several screens (theme tokens only), so the same look is not retyped.

// Blue pill above empty-state headings ("Getting started", "Welcome to Kanbo"); used with <Badge>.
export const ACCENT_BADGE_CLASS =
  "h-[26px] px-2.5 text-xs font-semibold bg-kb-blue-tint text-kb-blue-fg";

// Primary call-to-action next to an empty-state heading ("New Project"); used with <Button>.
export const CTA_BUTTON_CLASS = "h-11 gap-2 rounded-[10px] px-5 text-sm";

// Size and weight of a page title (My Tasks, Dashboard, Board, ...). The input version also wins
// over the Input component's own md:text-sm, for titles that are typed in (Add Task).
export const PAGE_TITLE_CLASS = "text-[28px] leading-tight font-semibold tracking-[-0.02em]";
export const PAGE_TITLE_INPUT_CLASS = `${PAGE_TITLE_CLASS} md:text-[28px]`;
