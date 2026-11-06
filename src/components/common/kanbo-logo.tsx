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
      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-kb-blue text-primary-foreground">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.5 19.9V4.1c0-1.5-.64-2.1-2.23-2.1H4.23C2.64 2 2 2.6 2 4.1v15.8c0 1.5.64 2.1 2.23 2.1h4.04c1.59 0 2.23-.6 2.23-2.1ZM22 12.9V4.1c0-1.5-.64-2.1-2.23-2.1h-4.04c-1.59 0-2.23.6-2.23 2.1v8.8c0 1.5.64 2.1 2.23 2.1h4.04c1.59 0 2.23-.6 2.23-2.1Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="flex flex-col gap-px">
        <span className="text-[15px] leading-tight font-semibold">Kanbo</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
