// Strikethrough icon in the iconsax Linear style (24 grid, 1.5 stroke, round caps); iconsax has no such icon.
export default function StrikethroughIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 12h17" />
      <path d="M16.6 6.2C16 4.8 14.3 3.8 12.2 3.8c-2.4 0-4.1 1.2-4.1 3.1 0 1.2.7 2 2 2.6" />
      <path d="M7.6 17.8c.7 1.4 2.4 2.4 4.5 2.4 2.6 0 4.3-1.3 4.3-3.3 0-1.3-.7-2.1-2-2.7" />
    </svg>
  );
}
