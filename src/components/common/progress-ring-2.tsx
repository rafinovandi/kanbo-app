"use client";

import { Label, Pie, PieChart, type SectorProps } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export type RingSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const polar = (cx: number, cy: number, r: number, angle: number) => {
  const rad = (-angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// A stroked arc with round caps instead of a filled sector, so the ends stay round at any sweep,
// including the start of the animation (a sector's cornerRadius is clamped to its size).
function RoundedArc({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  fill,
}: SectorProps) {
  const width = outerRadius - innerRadius;
  const radius = innerRadius + width / 2;
  const cap = ((width / 2 / radius) * 180) / Math.PI;
  const sweep = startAngle - endAngle;
  const from = sweep > 2 * cap ? startAngle - cap : startAngle - sweep / 2;
  const to = sweep > 2 * cap ? endAngle + cap : from;
  const a = polar(cx, cy, radius, from);
  const b = polar(cx, cy, radius, to);
  const d =
    from === to
      ? `M ${a.x} ${a.y} L ${a.x} ${a.y}`
      : `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${from - to > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={fill}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

// Donut split per category with the total in the middle, and the category list on the right.
// Colors are CSS variables (e.g. "var(--kb-blue)").
export default function ProgressRing2({
  segments,
  total,
  totalLabel,
  gap = 3,
}: {
  segments: RingSegment[];
  total: number;
  totalLabel: string;
  gap?: number;
}) {
  const chartConfig = Object.fromEntries(
    segments.map((s) => [s.key, { label: s.label, color: s.color }]),
  ) satisfies ChartConfig;

  const data =
    total > 0
      ? segments
          .filter((s) => s.value > 0)
          .map((s) => ({ name: s.key, value: s.value, fill: s.color }))
      : [{ name: "empty", value: 1, fill: "var(--kb-gray-tint)" }];

  return (
    <div className="flex items-center gap-5">
      <ChartContainer
        config={chartConfig}
        role="img"
        aria-label={`${total} ${totalLabel}`}
        className="aspect-square size-36 flex-none"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={64}
            shape={RoundedArc}
            paddingAngle={data.length > 1 ? gap : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                  return null;
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-[28px] font-semibold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      {totalLabel}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {segments.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-2 text-[13px]"
          >
            <span className="flex min-w-0 items-center gap-2 text-kb-text-2">
              <span
                aria-hidden="true"
                className="size-3 flex-none rounded-full border-[4px]"
                style={{ borderColor: s.color }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-semibold">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
