"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// /auth/callback sends the user back with ?error=auth when Google sign in didn't finish.
// In development it also passes ?error_description= with the real reason; production ignores it.
export default function LoginErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const reason = process.env.NODE_ENV === "development" ? searchParams.get("error_description") : null;

  useEffect(() => {
    if (error !== "auth") return;
    toast.error("Sign in didn't finish", {
      id: "login-error",
      description: reason ?? "Google sign in was cancelled or the link expired. Please try again.",
      duration: Infinity,
    });
  }, [error, reason]);

  return null;
}
