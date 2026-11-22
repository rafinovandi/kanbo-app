"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
// Adapted for the shadcn (radix-nova) combobox: SpaceUI originally targets a combobox
// with `ComboboxPopup` + `startAddon`, and uses @tabler/icons-react.
import {
  Check as IconCheck,
  Plus as IconPlus,
  Search as IconSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  // What to print under the avatar when it is read-only; defaults to the first name, like the selectable bubbles.
  label?: string;
}

export interface MemberSelectorProps {
  members: Member[];
  selected: string[];
  onChange?: (selected: string[]) => void;
  max?: number;
  maxVisible?: number;
  label?: string;
  className?: string;
  // Element the popup renders into; pass a Dialog's content when used inside one.
  portalContainer?: HTMLElement | null;
  size?: MemberSelectorSize;
  // Note shown under the member list inside the popup.
  footer?: React.ReactNode;
  // Only shows the selected members (photo and name): no add button, no popup, nothing to click.
  readOnly?: boolean;
}

type MemberSelectorSize = "default" | "sm";

const SIZES = {
  default: {
    avatar: "size-12",
    initials: "text-sm",
    plus: "size-5",
    badge: "size-4",
    badgeIcon: "size-2.5",
    gap: "gap-4",
    popup: "w-72",
    item: "px-3 py-2.5",
    itemAvatar: "size-9",
    name: "text-sm",
    email: "text-xs",
  },
  sm: {
    avatar: "size-8",
    initials: "text-xs",
    plus: "size-4",
    badge: "size-3.5",
    badgeIcon: "size-2",
    gap: "gap-3",
    popup: "w-64",
    item: "px-2.5 py-1.5",
    itemAvatar: "size-8",
    name: "text-[13px]",
    email: "text-[11px]",
  },
} as const;

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

function MemberAvatarContent({
  member,
  isSelected,
  dim,
}: {
  member: Member;
  isSelected: boolean;
  dim: (typeof SIZES)[MemberSelectorSize];
}) {
  return member.avatar ? (
    <img
      src={member.avatar}
      alt={member.name}
      referrerPolicy="no-referrer"
      className={cn(
        "size-full object-cover transition-[filter,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        !isSelected && "grayscale",
      )}
    />
  ) : (
    <div
      className={cn(
        "size-full flex items-center justify-center font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        dim.initials,
        isSelected
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {getInitials(member.name)}
    </div>
  );
}

// A member shown for reading only (photo and full name), used when the selector is `readOnly`.
function MemberStatic({
  member,
  size,
}: {
  member: Member;
  size: MemberSelectorSize;
}) {
  const dim = SIZES[size];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative rounded-full overflow-hidden", dim.avatar)}>
        <MemberAvatarContent member={member} isSelected dim={dim} />
      </div>
      <span className="text-xs font-medium text-foreground truncate max-w-24">
        {member.label ?? member.name.split(" ")[0]}
      </span>
    </div>
  );
}

interface MemberBubbleProps {
  member: Member;
  isSelected: boolean;
  onClick: () => void;
  size: MemberSelectorSize;
}

function MemberBubble({
  member,
  isSelected,
  onClick,
  size,
}: MemberBubbleProps) {
  const dim = SIZES[size];
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.85, filter: "blur(2px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.85, filter: "blur(2px)" }}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1.5 outline-none cursor-pointer"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        layout: { duration: 0.35, ease: MOTION_EASE },
        opacity: { duration: 0.25, ease: MOTION_EASE },
        scale: { duration: 0.25, ease: MOTION_EASE },
        filter: { duration: 0.25, ease: MOTION_EASE },
      }}
    >
      <div
        className={cn(
          "relative rounded-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          dim.avatar,
          "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2",
          !isSelected && "opacity-50 hover:opacity-75",
        )}
      >
        <MemberAvatarContent
          member={member}
          isSelected={isSelected}
          dim={dim}
        />
      </div>

      <AnimatePresence>
        {!isSelected && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: MOTION_EASE,
            }}
            className={cn(
              "absolute bottom-5 right-0 rounded-full bg-foreground flex items-center justify-center shadow-xs pointer-events-none",
              dim.badge,
            )}
          >
            <IconPlus
              className={cn("text-background", dim.badgeIcon)}
              strokeWidth={2.5}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <span
        className={cn(
          "text-xs font-medium truncate max-w-15 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSelected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {member.name.split(" ")[0]}
      </span>
    </motion.button>
  );
}

interface AddButtonProps extends React.ComponentPropsWithoutRef<
  typeof motion.button
> {
  isOpen: boolean;
  size: MemberSelectorSize;
}

const AddButton = React.forwardRef<HTMLButtonElement, AddButtonProps>(
  ({ isOpen, size, className, ...props }, ref) => {
    const dim = SIZES[size];
    return (
      <motion.button
        ref={ref}
        type="button"
        className={cn(
          "group flex flex-col items-center gap-1.5 outline-none cursor-pointer",
          className,
        )}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2, ease: MOTION_EASE }}
        {...props}
      >
        <div
          className={cn(
            "rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            dim.avatar,
            "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2",
            isOpen
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/40 hover:border-muted-foreground/60 hover:bg-muted/50",
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.25, ease: MOTION_EASE }}
          >
            <IconPlus
              className={cn(
                "transition-colors duration-200",
                dim.plus,
                isOpen ? "text-primary" : "text-muted-foreground",
              )}
            />
          </motion.div>
        </div>
        <span
          className={cn(
            "text-xs font-medium transition-colors duration-200",
            isOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          Add
        </span>
      </motion.button>
    );
  },
);
AddButton.displayName = "AddButton";

export const MemberSelector = React.forwardRef<
  HTMLDivElement,
  MemberSelectorProps
>(
  (
    {
      members,
      selected,
      onChange,
      max,
      maxVisible = 5,
      label,
      className,
      portalContainer,
      size = "default",
      footer,
      readOnly,
    },
    ref,
  ) => {
    const dim = SIZES[size];
    const [open, setOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const visibleMembers = React.useMemo(() => {
      return members
        .toSorted((a, b) => {
          const aSel = selected.includes(a.id);
          const bSel = selected.includes(b.id);
          return aSel && !bSel ? -1 : !aSel && bSel ? 1 : 0;
        })
        .slice(0, maxVisible);
    }, [members, selected, maxVisible]);

    const sortedMembers = React.useMemo(() => {
      return members.toSorted((a, b) => {
        const aSel = selected.includes(a.id);
        const bSel = selected.includes(b.id);
        return aSel && !bSel ? -1 : !aSel && bSel ? 1 : 0;
      });
    }, [members, selected]);

    const selectedMembers = React.useMemo(() => {
      return members.filter((m) => selected.includes(m.id));
    }, [members, selected]);

    const handleToggleSelect = (id: string) => {
      if (selected.includes(id)) {
        onChange?.(selected.filter((item) => item !== id));
      } else {
        if (max && selected.length >= max) return;
        onChange?.([...selected, id]);
      }
    };

    if (readOnly) {
      return (
        <div ref={ref} className={cn("relative", className)}>
          <div className={cn("flex items-start flex-wrap", dim.gap)}>
            {selectedMembers.map((member) => (
              <MemberStatic key={member.id} member={member} size={size} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("relative", className)}>
        {label && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {label}
          </div>
        )}
        <div className={cn("flex items-start flex-wrap", dim.gap)}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleMembers.map((member) => (
              <MemberBubble
                key={member.id}
                member={member}
                isSelected={selected.includes(member.id)}
                onClick={() => handleToggleSelect(member.id)}
                size={size}
              />
            ))}
          </AnimatePresence>
          <motion.div
            layout
            transition={{ duration: 0.35, ease: MOTION_EASE }}
            className="relative"
          >
            <Combobox
              autoHighlight
              items={sortedMembers}
              multiple
              value={selectedMembers}
              onValueChange={(newSelectedMembers) => {
                if (max && newSelectedMembers.length > max) return;
                onChange?.(newSelectedMembers.map((m) => m.id));
              }}
              open={open}
              onOpenChange={(nextOpen, details) => {
                if (details.reason === "item-press") return;
                setOpen(nextOpen);
              }}
              itemToStringLabel={(item) =>
                item ? `${item.name} ${item.email ?? ""}` : ""
              }
              itemToStringValue={(item) => item?.id ?? ""}
              isItemEqualToValue={(a, b) => a?.id === b?.id}
            >
              <ComboboxTrigger
                render={
                  <AddButton ref={triggerRef} isOpen={open} size={size} />
                }
              />
              <ComboboxContent
                anchor={triggerRef}
                container={portalContainer}
                className={dim.popup}
              >
                <div className="p-2 border-b border-border">
                  <ComboboxInput
                    placeholder="Search members..."
                    showTrigger={false}
                    className="rounded-lg"
                  >
                    <InputGroupAddon align="inline-start">
                      <IconSearch className="size-4 text-muted-foreground" />
                    </InputGroupAddon>
                  </ComboboxInput>
                </div>
                <ComboboxEmpty className="text-center text-sm text-muted-foreground">
                  No members found
                </ComboboxEmpty>
                <ComboboxList className="overflow-y-auto p-1 gap-1">
                  {(member: Member) => {
                    const isSel = selected.includes(member.id);
                    return (
                      <ComboboxItem
                        key={member.id}
                        value={member}
                        indicator={false}
                        disabled={
                          !isSel && max !== undefined && selected.length >= max
                        }
                        className={cn(
                          "w-full flex items-center gap-3 not-first:mt-2 cursor-pointer rounded-lg transition-colors select-none",
                          dim.item,
                          "[&>.col-start-1]:hidden [&>.col-start-2]:flex [&>.col-start-2]:items-center [&>.col-start-2]:gap-3 [&>.col-start-2]:w-full [&>.col-start-2]:min-w-0",
                          isSel
                            ? "bg-muted hover:bg-muted/90"
                            : "hover:bg-muted/80",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-full overflow-hidden shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            dim.itemAvatar,
                            !isSel && "grayscale opacity-60",
                          )}
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div
                              className={cn(
                                "size-full flex items-center justify-center text-xs font-medium",
                                isSel
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {getInitials(member.name)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <div
                            className={cn(
                              "font-medium truncate transition-colors duration-200",
                              dim.name,
                              isSel ? "text-foreground" : "text-foreground/80",
                            )}
                          >
                            {member.name}
                          </div>
                          {member.email && (
                            <div
                              className={cn(
                                "text-muted-foreground truncate",
                                dim.email,
                              )}
                            >
                              {member.email}
                            </div>
                          )}
                        </div>

                        <div
                          className={cn(
                            "size-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
                            isSel
                              ? "bg-primary"
                              : "border-2 border-muted-foreground/30",
                          )}
                        >
                          {isSel && (
                            <motion.div
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.18, ease: MOTION_EASE }}
                            >
                              <IconCheck
                                className="size-3 text-primary-foreground"
                                strokeWidth={3}
                              />
                            </motion.div>
                          )}
                        </div>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
                {footer && (
                  <div
                    className={cn(
                      "border-t border-border px-3 py-2 leading-snug text-muted-foreground",
                      dim.email,
                    )}
                  >
                    {footer}
                  </div>
                )}
              </ComboboxContent>
            </Combobox>
          </motion.div>
        </div>
      </div>
    );
  },
);

MemberSelector.displayName = "MemberSelector";
export default MemberSelector;
