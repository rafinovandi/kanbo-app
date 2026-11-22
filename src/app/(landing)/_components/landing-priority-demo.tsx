"use client";

import { useState } from "react";

import PrioritySlider from "@/components/common/priority-slider";
import type { TaskPriority } from "@/types/task";

export default function LandingPriorityDemo() {
  const [priority, setPriority] = useState<TaskPriority>("high");
  return <PrioritySlider value={priority} onValueChange={setPriority} />;
}
