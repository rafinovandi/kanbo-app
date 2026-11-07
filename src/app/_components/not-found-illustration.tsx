import { kbAnimation } from "@/lib/utils";

// The "0" of the 404 page (spec §13): a floating card with "?" and a magnifier orbiting it.
// SVG elements in the error hero's 360×200 coordinates (disc center 180,108), theme tokens only.
// Both animations stop under prefers-reduced-motion.
export default function NotFoundIllustration() {
  return (
    <>
      {/* Floating card */}
      <g className="kb-anim" style={kbAnimation("kb-float", 3, 0, { ["--kb-float" as string]: "-5px" })}>
        <rect x="150" y="80" width="60" height="58" rx="12" className="fill-card stroke-border" />
        <rect x="160" y="90" width="22" height="7" rx="3.5" className="fill-kb-lilac-tint" />
        <text x="180" y="129" textAnchor="middle" fontSize="28" fontWeight="700" className="fill-kb-blue">
          ?
        </text>
      </g>

      {/* Magnifier circling the card */}
      <g className="kb-anim" style={kbAnimation("kb-orbit", 6, 0, { transformOrigin: "180px 108px" }, "linear")}>
        <g transform="translate(222 58)">
          <circle r="11" strokeWidth="3" className="fill-card stroke-foreground" />
          <path d="M8 8l9 9" strokeWidth="4" strokeLinecap="round" className="stroke-foreground" />
        </g>
      </g>
    </>
  );
}
