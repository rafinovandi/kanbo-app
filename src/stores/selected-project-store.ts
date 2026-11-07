import { create } from "zustand";
import { persist } from "zustand/middleware";

// The project picked in the sidebar switcher. Saved per browser; the Board menu opens this project.
type SelectedProjectState = {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
};

export const useSelectedProjectStore = create<SelectedProjectState>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    { name: "kanbo-selected-project" },
  ),
);
