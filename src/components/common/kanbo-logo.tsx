import Image from "next/image";

import { cn } from "@/lib/utils";

export default function KanboLogo({
  subtitle,
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3 text-foreground", className)}>
      <Image
        src="/new-logo.png"
        alt=""
        width={36}
        height={36}
        className="size-9 flex-none amethyst:hidden"
        priority
      />
      <Image
        src="/new-logo-purple.png"
        alt=""
        width={36}
        height={36}
        className="hidden size-9 flex-none amethyst:block"
        priority
      />
      <span className="flex flex-col gap-px">
        <span className="text-[15px] leading-tight font-semibold">Kanbo</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </span>
  );
}
