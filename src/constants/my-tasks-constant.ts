import { FolderAdd, Kanban, People, type Icon } from "iconsax-react";

// "How it works" steps in the My Tasks empty state (design: "My Tasks (empty, new user)").
export const MY_TASKS_STEPS: {
  title: string;
  description: string;
  icon: Icon;
  toneClass: string;
}[] = [
  {
    title: "1. Create a project",
    description: "Name it and pick a color.",
    icon: FolderAdd,
    toneClass: "bg-kb-blue-tint text-kb-blue-fg",
  },
  {
    title: "2. Add tasks",
    description: "Move them from To Do to Done.",
    icon: Kanban,
    toneClass: "bg-kb-orange-tint text-kb-orange-fg",
  },
  {
    title: "3. Invite your team",
    description: "Assign tasks once they join.",
    icon: People,
    toneClass: "bg-kb-lilac-tint text-kb-lilac-fg",
  },
];
