import { kbAnimation } from "@/lib/utils";

const AVATARS = [
  { cx: 172, bg: "fill-kb-blue-tint", fg: "fill-kb-blue-fg", label: "AP" },
  { cx: 188, bg: "fill-kb-orange-tint", fg: "fill-kb-orange-fg", label: "BS" },
  { cx: 204, bg: "fill-kb-lilac-tint", fg: "fill-kb-lilac-fg", label: "CL" },
];

// Floating cards: white card with a hairline border.
const CARD_CLASS = "fill-card stroke-border";

export default function LoginVisual() {
  return (
    <section
      aria-label="Kanbo preview"
      className="relative min-h-[360px] flex-1 overflow-hidden rounded-3xl bg-kb-surface bg-[url(/login-grid.svg)] bg-cover bg-center sm:min-h-[560px]"
    >
      <svg
        viewBox="0 0 560 720"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="A task card moving to Done on a Kanbo board"
        className="absolute inset-0 size-full"
      >
        <defs>
          <filter id="kb-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow
              dx="0"
              dy="14"
              stdDeviation="16"
              floodOpacity=".10"
              style={{ floodColor: "var(--foreground)" }}
            />
          </filter>
        </defs>

        {/* Floating task card */}
        <g className="kb-anim" style={kbAnimation("kb-float", 5, 0, { ["--kb-float" as string]: "-8px" })}>
          <rect x="140" y="290" width="280" height="150" rx="18" className={CARD_CLASS} filter="url(#kb-shadow)" />
          <rect x="160" y="310" width="52" height="20" rx="7" className="fill-kb-red-tint" />
          <text x="186" y="324" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-kb-red-fg">
            High
          </text>
          <rect x="160" y="344" width="200" height="9" rx="4.5" opacity=".85" className="fill-foreground" />
          <rect x="160" y="361" width="140" height="9" rx="4.5" opacity=".85" className="fill-foreground" />
          <rect x="160" y="388" width="240" height="1" className="fill-kb-divider" />
          {AVATARS.map((avatar) => (
            <g key={avatar.label}>
              <circle cx={avatar.cx} cy="414" r="11" strokeWidth="2" className={`${avatar.bg} stroke-background`} />
              <text x={avatar.cx} y="418" textAnchor="middle" fontSize="9" fontWeight="600" className={avatar.fg}>
                {avatar.label}
              </text>
            </g>
          ))}
          <rect x="350" y="408" width="50" height="12" rx="6" className="fill-kb-divider" />
          {/* Circle that turns into a green check */}
          <circle cx="396" cy="320" r="12" className="fill-kb-divider" />
          <circle cx="396" cy="320" r="12" className="kb-anim fill-kb-green" style={kbAnimation("kb-check-fill", 5)} />
          <path
            d="m390.5 320.2 3.8 3.8 6.6-7"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="16"
            strokeDashoffset="0"
            className="kb-anim stroke-background"
            style={kbAnimation("kb-check-draw", 5)}
          />
        </g>

        {/* Progress ring card */}
        <g className="kb-anim" style={kbAnimation("kb-float", 6, 0.6, { ["--kb-float" as string]: "-10px" })}>
          <rect x="370" y="210" width="120" height="64" rx="16" className={CARD_CLASS} filter="url(#kb-shadow)" />
          <g transform="translate(400 242)">
            <circle r="15" strokeWidth="5" fill="none" className="stroke-kb-divider" />
            <circle
              r="15"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset="25"
              transform="rotate(-90)"
              className="kb-anim stroke-kb-blue"
              style={kbAnimation("kb-ring-fill", 5, 0, { ["--kb-ring-to" as string]: 25 })}
            />
          </g>
          <rect x="424" y="232" width="50" height="8" rx="4" className="fill-kb-line" />
          <rect x="424" y="246" width="34" height="8" rx="4" className="fill-border" />
        </g>

        {/* "Moved to Done" pill */}
        <g className="kb-anim" style={kbAnimation("kb-float", 7, 1.2, { ["--kb-float" as string]: "8px" })}>
          <rect x="76" y="468" width="150" height="44" rx="22" className={CARD_CLASS} filter="url(#kb-shadow)" />
          <circle cx="100" cy="490" r="5" className="fill-kb-green" />
          <text x="114" y="494.5" fontSize="12.5" fontWeight="500" className="fill-kb-text-2">
            Moved to Done
          </text>
        </g>

        {/* Sparkle */}
        <path
          d="M110 250l2.4 6.4 6.4 2.4-6.4 2.4-2.4 6.4-2.4-6.4-6.4-2.4 6.4-2.4Z"
          className="kb-anim fill-kb-lilac"
          style={kbAnimation("kb-sparkle", 2.6)}
        />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-10">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-kb-gray" />
          <span className="size-2 rounded-full bg-kb-blue" />
          <span className="size-2 rounded-full bg-kb-orange" />
          <span className="size-2 rounded-full bg-kb-green" />
        </span>
        <p className="max-w-[420px] text-[26px] leading-tight font-semibold tracking-[-0.02em]">
          Plan it, move it, ship it — together.
        </p>
        <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
          Boards, tasks and your team in one calm workspace.
        </p>
      </div>
    </section>
  );
}
