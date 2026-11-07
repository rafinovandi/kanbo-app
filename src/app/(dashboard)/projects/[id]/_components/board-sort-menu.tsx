"use client";

import { Sort } from "iconsax-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SORT_OPTIONS } from "@/constants/board-constant";
import type useBoardView from "@/hooks/use-board-view";
import type { BoardSort } from "@/types/board";

// Sort button: the order of the cards inside each column. Anything but Manual turns card dragging off.
export default function BoardSortMenu({ boardView }: { boardView: ReturnType<typeof useBoardView> }) {
  const { sort } = boardView.view;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={sort === "manual" ? "outline" : "default"} className="gap-2">
          <Sort size={18} variant="Linear" color="currentColor" aria-hidden />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => boardView.handleChangeSort(value as BoardSort)}>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
