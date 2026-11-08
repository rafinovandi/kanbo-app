"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type PinActionResult = { status: "success" } | { status: "error"; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function change(projectId: string, pin: boolean): Promise<PinActionResult> {
  if (!UUID.test(projectId)) return { status: "error", message: "Something went wrong. Try again." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { status: "error", message: "Your session expired. Sign in again." };

  // The database enforces active membership and the limit of 3 pins (trigger limit_pins).
  const { error } = pin
    ? await supabase.from("project_pins").insert({ project_id: projectId })
    : await supabase.from("project_pins").delete().eq("project_id", projectId).eq("user_id", userId);
  if (error) {
    return { status: "error", message: error.code === "P0001" ? error.message : "Something went wrong. Try again." };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}

export async function pinProjectAction(projectId: string): Promise<PinActionResult> {
  return change(projectId, true);
}

export async function unpinProjectAction(projectId: string): Promise<PinActionResult> {
  return change(projectId, false);
}
