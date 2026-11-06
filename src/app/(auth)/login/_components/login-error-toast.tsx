"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// /auth/callback sends the user back with ?error=auth when Google sign in didn't finish.
// In development it also passes ?error_description= with the real reason (plain text).
export default function LoginErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const reason = searchParams.get("error_description");

  useEffect(() => {
    if (!error) return;
    toast.error("Sign in didn't finish", {
      id: "login-error",
      description: reason ?? "Google sign in was cancelled or the link expired. Please try again.",
      duration: Infinity,
    });
  }, [error, reason]);

  return null;
}
