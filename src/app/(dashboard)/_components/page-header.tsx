import { ArrowLeft, Notification, type Icon } from "iconsax-react";
import Link from "next/link";

import ThemeToggle from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Top bar (spec §4): page icon + name on the left, Notifications on the right.
// On phones the sidebar opens from the trigger. Sub-pages pass `backHref`: a back arrow replaces the page icon.
export default function PageHeader({
  title,
  icon: PageIcon,
  backHref,
}: {
  title: string;
  icon?: Icon;
  backHref?: string;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-kb-divider px-4 py-4 sm:px-7">
      <div className="flex items-center gap-2.5 text-[15px] font-semibold">
        <SidebarTrigger className="-ml-1 md:hidden" />
        {backHref ? (
          <Button asChild variant="ghost" size="icon" aria-label={`Back from ${title}`}>
            <Link href={backHref}>
              <ArrowLeft size={20} variant="Linear" color="currentColor" aria-hidden />
            </Link>
          </Button>
        ) : (
          PageIcon && <PageIcon size={20} variant="Linear" color="currentColor" aria-hidden />
        )}
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* Notifications have no behavior yet (spec §16). */}
        <Button variant="outline" size="icon" className="size-10 rounded-[10px]" aria-label="Notifications">
          <Notification size={20} variant="Linear" color="currentColor" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
