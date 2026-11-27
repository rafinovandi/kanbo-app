import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";

// Board sortables leave out OptimisticSortingPlugin: React state owns the order, so the library never moves DOM nodes itself.
export const BOARD_SORTABLE_PLUGINS = [SortableKeyboardPlugin];
