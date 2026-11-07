import { kbAnimation } from "@/lib/utils";

// The "0" of the 410 page: two chain links pull apart, a spark flashes, a small clock
// sits beside them. SVG elements in the error hero's 360×200 coordinates (disc center 180,108).
export default function InviteExpiredIllustration() {
  const pull = (x: number, y: number) =>
    kbAnimation("kb-pull", 3.2, 0, { ["--kb-pull-x" as string]: `${x}px`, ["--kb-pull-y" as string]: `${y}px` });

  return (
    <>
      <g className="kb-anim" style={pull(-7, 4)}>
        <g transform="rotate(-35 160 120)">
          <rect x="132" y="108" width="44" height="24" rx="12" strokeWidth="7" className="stroke-kb-yellow-fg" />
        </g>
      </g>
      <g className="kb-anim" style={pull(7, -4)}>
        <g transform="rotate(-35 200 96)">
          <rect x="184" y="84" width="44" height="24" rx="12" strokeWidth="7" className="stroke-kb-orange" />
        </g>
      </g>

      <g
        strokeWidth="2.4"
        strokeLinecap="round"
        className="kb-anim stroke-kb-yellow-fg opacity-0"
        style={kbAnimation("kb-spark", 3.2, 0, undefined, "linear")}
      >
        <path d="M170 96l-6-8M180 92v-10M190 98l7-6M168 120l-8 4M192 120l8 6" />
      </g>

      <g transform="translate(232 158)">
        <circle r="14" className="fill-card stroke-border" />
        <circle r="8" strokeWidth="1.8" className="stroke-kb-yellow-fg" />
        <path d="M0 -4v4l3 2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-kb-yellow-fg" />
      </g>
    </>
  );
}
