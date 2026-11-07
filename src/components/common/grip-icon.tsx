// Six-dot drag handle icon (iconsax has none).
export default function GripIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      {[5.5, 10.5].flatMap((x) => [3.5, 8, 12.5].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />))}
    </svg>
  );
}
