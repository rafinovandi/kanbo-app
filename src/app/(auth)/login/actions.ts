"use server";

import { redirect } from "next/navigation";

import { environment } from "@/configs/environment";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/utils";
import type { FormState } from "@/types/general";

// Starts Google OAuth (PKCE). Supabase sends the user back to /auth/callback.
export async function signInWithGoogle(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = getSafeRedirectPath(formData.get("next"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${environment.APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    // Keep the provider's raw message server-side; show the user a generic one.
    if (error) console.error("Google sign-in failed:", error.message);
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Could not connect to Google. Please try again."],
      },
    };
  }

  redirect(data.url);
}
