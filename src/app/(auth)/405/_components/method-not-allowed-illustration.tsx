import { kbAnimation } from "@/lib/utils";

// The "0" of the 405 page: a floating card with a "not allowed" sign and a cursor that keeps
// reaching for it. SVG elements in the error hero's 360×200 coordinates (disc center 180,108),
// theme tokens only. Both animations stop under prefers-reduced-motion.
export default function MethodNotAllowedIllustration() {
  return (
    <>
      <g className="kb-anim" style={kbAnimation("kb-float", 3, 0, { ["--kb-float" as string]: "-5px" })}>
        <rect x="150" y="80" width="60" height="58" rx="12" className="fill-card stroke-border" />
        <rect x="160" y="90" width="22" height="7" rx="3.5" className="fill-kb-lilac-tint" />
        <circle cx="180" cy="117" r="11" strokeWidth="3" className="stroke-kb-lilac-fg" />
        <path d="M172.5 124.5l15-15" strokeWidth="3" strokeLinecap="round" className="stroke-kb-lilac-fg" />
      </g>

      <g className="kb-anim" style={kbAnimation("kb-cursor-nudge", 2.4, 0)}>
        <path
          d="M214 132v18l4.8-4.2 3.2 7 2.8-1.2-3.2-7h6.4Z"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </g>
    </>
  );
}
