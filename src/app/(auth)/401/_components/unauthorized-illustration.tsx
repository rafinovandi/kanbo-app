import { kbAnimation } from "@/lib/utils";

// The "0" of the 401 page (spec §13): a key slides toward a keyhole. SVG elements in the error
// hero's 360×200 coordinates (disc center 180,108), theme tokens only. The slide stops under
// prefers-reduced-motion (the key rests next to the keyhole).
export default function UnauthorizedIllustration() {
  return (
    <>
      {/* Keyhole plate */}
      <rect x="158" y="84" width="44" height="52" rx="12" className="fill-card stroke-border" />
      <circle cx="180" cy="104" r="7" className="fill-kb-lilac-fg" />
      <path d="M176 106h8l2 16h-12Z" className="fill-kb-lilac-fg" />

      {/* Key */}
      <g className="kb-anim" style={kbAnimation("kb-key-slide", 4, 0)}>
        <g transform="translate(120 150) rotate(-20)">
          <circle r="10" className="fill-kb-lilac" />
          <circle r="4" className="fill-background" />
          <rect x="8" y="-3" width="30" height="6" rx="3" className="fill-kb-lilac" />
          <rect x="28" y="2" width="4" height="7" rx="1.5" className="fill-kb-lilac" />
          <rect x="34" y="2" width="4" height="5" rx="1.5" className="fill-kb-lilac" />
        </g>
      </g>
    </>
  );
}
