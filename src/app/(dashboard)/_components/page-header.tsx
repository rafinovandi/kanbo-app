import { ArrowLeft, type Icon } from "iconsax-react";

import NotificationsMenu from "@/components/common/notifications-menu";
import ThemeToggle from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

import BackLink from "@/components/common/back-link";

// Top bar: page icon + name on the left, theme toggle and Notifications (tasks that are due) on the right.
// On phones the sidebar opens from the burger button, so the page icon is hidden there. Sub-pages pass `backHref`:
// a back arrow replaces the page icon.
export default function PageHeader({
  title,
  icon: PageIcon,
  backHref,
  backToPrevious = false,
}: {
  title: string;
  icon?: Icon;
  backHref?: string;
  backToPrevious?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-kb-divider px-4 py-4 sm:px-7">
      <div className="flex items-center gap-2.5 text-[15px] font-semibold">
        <SidebarTrigger className="-ml-1 md:hidden" />
        {backHref ? (
          <Button asChild variant="ghost" size="icon" aria-label={`Back from ${title}`}>
            <BackLink href={backHref} previous={backToPrevious}>
              <ArrowLeft size={20} variant="Linear" color="currentColor" aria-hidden />
            </BackLink>
          </Button>
        ) : (
          PageIcon && <PageIcon size={20} variant="Linear" color="currentColor" className="max-md:hidden" aria-hidden />
        )}
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsMenu />
      </div>
    </header>
  );
}
