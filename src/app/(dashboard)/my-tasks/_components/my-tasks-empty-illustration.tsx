import { kbAnimation } from "@/lib/utils";

// Animated illustration for a user with no projects: a small board (To Do, In Progress, Done) where
// a task card is dragged across, a check pops on Done and a progress ring fills. 6s loop; static
// frame under prefers-reduced-motion (the `kb-anim` class). Colors are theme tokens.

// Dashed empty slot inside a column.
const SLOT_CLASS = "stroke-kb-faint";
// Column background + title bar.
const COLUMNS = [
  { x: 60, dotClass: "fill-kb-gray", titleWidth: 34, extraSlot: true },
  { x: 160, dotClass: "fill-kb-blue", titleWidth: 44, extraSlot: false },
  { x: 260, dotClass: "fill-kb-green", titleWidth: 28, extraSlot: false },
];

export default function MyTasksEmptyIllustration() {
  return (
    <svg
      width="420"
      height="260"
      viewBox="0 0 420 260"
      fill="none"
      role="img"
      aria-label="A task card moving across a small board from To Do to Done"
      className="block h-auto max-w-full"
    >
      <circle cx="78" cy="70" r="56" opacity=".7" className="fill-kb-blue-tint" />
      <circle cx="352" cy="206" r="64" opacity=".8" className="fill-kb-lilac-tint" />

      {/* Board */}
      <rect x="40" y="34" width="340" height="196" rx="18" className="fill-card stroke-border" />
      <rect x="60" y="52" width="92" height="8" rx="4" className="fill-border" />
      <rect x="60" y="66" width="56" height="6" rx="3" className="fill-kb-gray-tint" />

      {COLUMNS.map((column) => (
        <g key={column.x}>
          <rect x={column.x} y="86" width="90" height="126" rx="12" className="fill-kb-surface" />
          <rect x={column.x + 10} y="98" width="4" height="10" rx="2" className={column.dotClass} />
          <rect x={column.x + 20} y="100" width={column.titleWidth} height="6" rx="3" className="fill-kb-line" />
          <rect
            x={column.x + 8}
            y="118"
            width="74"
            height="34"
            rx="9"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className={SLOT_CLASS}
          />
          {column.extraSlot && (
            <rect
              x={column.x + 8}
              y="160"
              width="74"
              height="34"
              rx="9"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity=".5"
              className={SLOT_CLASS}
            />
          )}
        </g>
      ))}

      {/* Check badge on Done */}
      <g opacity="0" className="kb-anim" style={kbAnimation("kb-pop-check", 6, 0, undefined, "linear")}>
        <circle cx="336" cy="103" r="8" className="fill-kb-green" />
        <path
          d="m332.5 103.2 2.4 2.4 4.6-4.8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-background"
        />
      </g>

      {/* The task card + cursor, hopping across the columns */}
      <g className="kb-anim" style={kbAnimation("kb-card-hop", 6, 0, undefined, "cubic-bezier(0.4, 0, 0.2, 1)")}>
        <rect x="68" y="120" width="74" height="34" rx="9" opacity=".06" className="fill-foreground" />
        <rect x="68" y="118" width="74" height="34" rx="9" className="fill-card stroke-border" />
        <rect x="76" y="125" width="24" height="8" rx="4" className="fill-kb-red-tint" />
        <rect x="76" y="139" width="44" height="5" rx="2.5" className="fill-kb-line" />
        <circle cx="132" cy="129" r="5.5" strokeWidth="1.5" className="fill-kb-blue-tint stroke-background" />
        <circle cx="125" cy="129" r="5.5" strokeWidth="1.5" className="fill-kb-orange-tint stroke-background" />
        <path
          d="M124 140v15l4-4 3.2 6.4 2.4-1.2-3.2-6.2h5.6Z"
          strokeWidth="1.2"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </g>

      {/* Progress ring */}
      <g transform="translate(372 40)">
        <circle r="21" className="fill-card stroke-border" />
        <circle r="13" strokeWidth="4" className="stroke-kb-gray-tint" />
        <circle
          r="13"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset="66"
          transform="rotate(-90)"
          className="kb-anim stroke-kb-blue"
          style={kbAnimation("kb-board-ring", 6, 0, undefined, "linear")}
        />
      </g>

      {/* Floating "+" bubble */}
      <g className="kb-anim" style={kbAnimation("kb-float", 3, 0, { "--kb-float": "-6px" })}>
        <circle cx="44" cy="222" r="17" className="fill-foreground" />
        <path d="M38 222h12M44 216v12" strokeWidth="1.8" strokeLinecap="round" className="stroke-background" />
      </g>

      {/* Twinkling sparkles */}
      <path
        d="M22 118l2.2 5.8L30 126l-5.8 2.2L22 134l-2.2-5.8L14 126l5.8-2.2Z"
        className="kb-anim fill-kb-lilac"
        style={kbAnimation("kb-sparkle", 2.4)}
      />
      <path
        d="M210 8l1.8 4.6 4.6 1.8-4.6 1.8-1.8 4.6-1.8-4.6-4.6-1.8 4.6-1.8Z"
        className="kb-anim fill-kb-orange"
        style={kbAnimation("kb-sparkle", 2.4, 0.8)}
      />
      <path
        d="M402 120l2 5.2 5.2 2-5.2 2-2 5.2-2-5.2-5.2-2 5.2-2Z"
        className="kb-anim fill-kb-pink"
        style={kbAnimation("kb-sparkle", 2.4, 1.6)}
      />
    </svg>
  );
}
