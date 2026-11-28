import { kbAnimation } from "@/lib/utils";

// The generic error hero (no digits): a card rocking on the disc with a throbbing alert badge.
// SVG elements in the error hero's 360×200 coordinates (disc center 180,108), theme tokens only.
// Both animations stop under prefers-reduced-motion.
export default function ServerErrorIllustration() {
  return (
    <>
      <g className="kb-anim" style={kbAnimation("kb-rock", 3.2, 0, { transformOrigin: "180px 109px" })}>
        <rect x="150" y="80" width="60" height="58" rx="12" className="fill-card stroke-border" />
        <rect x="160" y="90" width="22" height="7" rx="3.5" className="fill-border" />
        <path d="M160 108h40M160 117h28M160 126h34" strokeWidth="4" strokeLinecap="round" className="stroke-border" />
      </g>

      <g className="kb-anim" style={kbAnimation("kb-throb", 2, 0, { transformOrigin: "212px 78px" })}>
        <g transform="translate(212 78)">
          <circle r="13" className="fill-kb-red-fg" />
          <path d="M0 -6v7" strokeWidth="2.6" strokeLinecap="round" className="stroke-background" />
          <circle cy="6" r="1.6" className="fill-background" />
        </g>
      </g>
    </>
  );
}
