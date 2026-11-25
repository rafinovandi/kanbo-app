"use client";

import {
  ArrowDown2,
  CloseCircle,
  Profile2User,
  SearchNormal1,
} from "iconsax-react";
import { useState } from "react";

import PersonFilterRow from "@/components/common/person-filter-row";
import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type PersonOption = {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  avatarUrl?: string | null;
  avatarBg?: string;
  avatarFg?: string;
};

// Dropdown that narrows a list to one person: a people search, an "All" row with the total and every person with
// their count. The chosen person shows on the button with a × to go back to everyone.
export default function PersonFilter({
  label = "Assignee",
  allLabel = "All tasks",
  people,
  totalCount,
  value,
  selfId,
  onChange,
}: {
  label?: string;
  allLabel?: string;
  people: PersonOption[];
  totalCount: number;
  value: string | null;
  selfId?: string;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = people.find((person) => person.id === value) ?? null;
  const matches = people.filter((person) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setQuery("");
  };
  const pick = (id: string | null) => {
    onChange(id);
    handleOpenChange(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={selected ? "default" : "outline"}
            className="gap-2"
            aria-haspopup="listbox"
            aria-label={`Filter by ${label.toLowerCase()}: ${selected ? selected.name : allLabel}`}
          >
            {selected ? (
              <UserAvatar
                name={selected.name}
                avatarUrl={selected.avatarUrl}
                avatarBg={selected.avatarBg}
                avatarFg={selected.avatarFg}
                size="sm"
              />
            ) : (
              <Profile2User
                size={18}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
            )}
            <span className="opacity-70">{label}</span>
            <span>
              {selected
                ? selected.id === selfId
                  ? "You"
                  : selected.name
                : allLabel}
            </span>
            <span className="text-xs opacity-70">
              {selected ? selected.count : totalCount}
            </span>
            <ArrowDown2
              size={14}
              variant="Linear"
              color="currentColor"
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-72 flex-col gap-2 p-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchNormal1
                size={16}
                variant="Linear"
                color="currentColor"
                aria-hidden
              />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="[&::-webkit-search-cancel-button]:appearance-none"
            />
          </InputGroup>
          <div
            role="listbox"
            aria-label={label}
            className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
          >
            <PersonFilterRow
              selected={value === null}
              onPick={() => pick(null)}
              icon={
                <Profile2User
                  size={18}
                  variant="Linear"
                  color="currentColor"
                  aria-hidden
                />
              }
              title={allLabel}
              count={totalCount}
            />
            <div role="separator" className="my-1 h-px bg-border" />
            {matches.map((person) => (
              <PersonFilterRow
                key={person.id}
                selected={person.id === value}
                onPick={() => pick(person.id)}
                icon={
                  <UserAvatar
                    name={person.name}
                    avatarUrl={person.avatarUrl}
                    avatarBg={person.avatarBg}
                    avatarFg={person.avatarFg}
                    size="sm"
                  />
                }
                title={
                  person.id === selfId ? `${person.name} (You)` : person.name
                }
                subtitle={person.subtitle}
                count={person.count}
              />
            ))}
            {matches.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No one matches “{query.trim()}”.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Show ${allLabel.toLowerCase()}`}
          title={`Show ${allLabel.toLowerCase()}`}
          onClick={() => onChange(null)}
        >
          <CloseCircle
            size={18}
            variant="Linear"
            color="currentColor"
            aria-hidden
          />
        </Button>
      )}
    </div>
  );
}
