// Terminal prompt icon (>_) in the iconsax Linear style (24 grid, round caps); iconsax has no such icon.
export default function TerminalIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 8l4 4-4 4" />
      <path d="M12 16h7" />
    </svg>
  );
}
