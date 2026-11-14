"use client";

import { useId } from "react";
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  useChartWidth,
  useOffset,
  XAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type PeakPoint = { key: string; label: string; value: number };

// Spans the plot area, so the fade also works on a flat line (a bounding-box gradient has no height then).
function PeakGradient({
  id,
  color,
  peak,
}: {
  id: string;
  color: string;
  peak: number;
}) {
  const width = useChartWidth() ?? 0;
  const offset = useOffset();
  return (
    <defs>
      <linearGradient
        id={id}
        gradientUnits="userSpaceOnUse"
        x1={offset?.left ?? 0}
        x2={width - (offset?.right ?? 0)}
        y1={0}
        y2={0}
      >
        <stop offset="0%" stopColor={color} stopOpacity={0.12} />
        <stop offset={`${peak * 100}%`} stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={color} stopOpacity={0.12} />
      </linearGradient>
    </defs>
  );
}

// Smooth line chart that is fully colored at its highest point and fades toward both ends.
// Only the peak gets a dot. Color is a CSS variable (e.g. "var(--kb-blue)").
export default function PeakLineChart({
  data,
  label,
  color = "var(--kb-blue)",
}: {
  data: PeakPoint[];
  label: string;
  color?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const chartConfig = { value: { label, color } } satisfies ChartConfig;

  const max = Math.max(...data.map((d) => d.value), 0);
  const peakIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1;
  const peakRatio =
    data.length > 1 ? Math.max(peakIndex, 0) / (data.length - 1) : 0.5;

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 16, left: 16, right: 16 }}
      >
        <PeakGradient id={gradientId} color={color} peak={peakRatio} />
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" color={color} />}
        />
        <Line
          dataKey="value"
          type="natural"
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          dot={({ index, cx, cy }) =>
            index === peakIndex ? (
              <Dot
                key={`peak-${index}`}
                r={5}
                cx={cx}
                cy={cy}
                fill="var(--color-white)"
                stroke={color}
                strokeWidth={2.5}
              />
            ) : (
              <g key={`dot-${index}`} />
            )
          }
          activeDot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
