import { kbAnimation } from "@/lib/utils";

// The "0" of the 403 page: a padlock that wiggles now and then. SVG elements in the error hero's
// 360×200 coordinates (disc center 180,108), theme tokens only. The wiggle stops under prefers-reduced-motion.
export default function ForbiddenIllustration() {
  return (
    <g className="kb-anim" style={kbAnimation("kb-wiggle", 3, 0, { transformOrigin: "180px 132px" })}>
      <path
        d="M164 104v-10a16 16 0 0 1 32 0v10"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        className="stroke-kb-orange-fg"
      />
      <rect x="152" y="102" width="56" height="44" rx="12" className="fill-kb-orange" />
      <circle cx="180" cy="120" r="6" className="fill-background" />
      <path d="M180 124v10" strokeWidth="4" strokeLinecap="round" className="stroke-background" />
    </g>
  );
}
