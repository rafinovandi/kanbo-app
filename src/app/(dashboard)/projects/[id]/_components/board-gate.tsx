import { Kanban } from "iconsax-react";
import { forbidden, notFound } from "next/navigation";
import { connection } from "next/server";

import PageTransition from "@/components/common/page-transition";
import { createClient } from "@/lib/supabase/server";

import PageHeader from "../../../_components/page-header";
import Board from "./board";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Shows the 403 page for a project that belongs to others and the 404 page for one that does not exist, before
// the Board loads its data in the browser. Reading the session checks the token's expiry against the
// current time, so it must wait for a real request first.
export default async function BoardGate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  await connection();
  const supabase = await createClient();
  const { data: access } = await supabase.rpc("project_access", { p_project_id: id });
  if (access === "forbidden") forbidden();
  if (access !== "member") notFound();

  return (
    <PageTransition>
      <PageHeader title="Board" icon={Kanban} />
      <div className="flex flex-col gap-5 p-4 sm:p-7">
        <Board key={id} projectId={id} />
      </div>
    </PageTransition>
  );
}
