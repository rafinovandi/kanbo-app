"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  completed: { label: "Completed", color: "var(--kb-blue)" },
} satisfies ChartConfig;

// Radial progress with "N% completed" in the middle (Dashboard and Board overview).
export default function ProgressRing({ percent }: { percent: number }) {
  const data = [
    { name: "completed", value: percent, fill: "var(--color-completed)" },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      role="img"
      aria-label={`${percent}% completed`}
      className="mx-auto aspect-square size-40"
    >
      <RadialBarChart
        data={data}
        startAngle={90}
        endAngle={90 - percent * 3.6}
        innerRadius={58}
        outerRadius={70}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-kb-gray-tint last:fill-(--kb-card-bg)"
          polarRadius={[70, 58]}
        />
        <RadialBar dataKey="value" cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                    className="fill-foreground text-[32px] font-semibold"
                  >
                    {percent}%
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy ?? 0) + 24}
                    className="fill-muted-foreground text-xs"
                  >
                    completed
                  </tspan>
                </text>
              );
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
