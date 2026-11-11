"use client";

import { Eye, More, Trash } from "iconsax-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_TONE } from "@/constants/profile-constant";
import { cn } from "@/lib/utils";
import type { BoardCategory } from "@/types/board";

// The ⋯ menu of a task card: every member can move it, only admins delete it.
export default function BoardCardMenu({
  categories,
  categoryId,
  isAdmin,
  onOpen,
  onMove,
  onRequestDelete,
}: {
  categories: BoardCategory[];
  categoryId: string;
  isAdmin: boolean;
  onOpen: () => void;
  onMove: (categoryId: string) => void;
  onRequestDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Task actions"
          onClick={(event) => event.stopPropagation()}
          className="absolute top-3 right-3 opacity-0 max-md:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <More size={18} variant="Linear" color="currentColor" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={onOpen} className="gap-2.5">
          <Eye size={18} variant="Linear" color="currentColor" aria-hidden />
          Open Task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={categoryId} onValueChange={onMove}>
          {categories.map((category) => (
            <DropdownMenuRadioItem key={category.id} value={category.id}>
              <span
                className={cn(
                  "size-2 rounded-full",
                  PROJECT_TONE[category.color].dot,
                )}
                aria-hidden="true"
              />
              {category.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={onRequestDelete}
              className="gap-2.5"
            >
              <Trash
                size={18}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
              Delete Task
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
