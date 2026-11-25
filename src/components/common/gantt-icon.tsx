// Three staggered bars, the Gantt view's icon (iconsax has none).
export default function GanttIcon({
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
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 5h9M7 12h10M10 19h11" />
    </svg>
  );
}
