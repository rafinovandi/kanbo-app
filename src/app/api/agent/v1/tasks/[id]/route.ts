import { withAuth } from "@/lib/agent/http";
import { updateTask } from "@/lib/agent/task-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, (ctx) => updateTask(ctx, request, id));
}
