import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

// "Signed in as {email} · ": reads the session, so it waits for a real request (callers sit behind <Suspense>).
export default async function SignedInAs() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  if (typeof email !== "string") return null;

  return (
    <>
      Signed in as <strong className="font-semibold text-foreground">{email}</strong> ·{" "}
    </>
  );
}
