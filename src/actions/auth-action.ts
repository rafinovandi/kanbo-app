"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Same as website_cafe: shared sign-out action used by the sidebar user menu.
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error.message);
  revalidatePath("/", "layout");
  redirect("/login");
}
