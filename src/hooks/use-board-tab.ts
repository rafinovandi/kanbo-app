import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type BoardTab = "kanban" | "gantt";

// The Board's view (Kanban or Gantt), kept in the page link as ?view=gantt so a reload or a shared link opens the same one.
export default function useBoardTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: BoardTab =
    searchParams.get("view") === "gantt" ? "gantt" : "kanban";

  const setTab = (next: BoardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "gantt") params.set("view", "gantt");
    else params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return { tab, setTab };
}
