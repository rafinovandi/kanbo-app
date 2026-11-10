import { withAuth } from "@/lib/agent/http";
import { deleteTask, getTask, updateTask } from "@/lib/agent/task-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(request, (ctx) => getTask(ctx, id));
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(request, (ctx) => updateTask(ctx, request, id));
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(request, (ctx) => deleteTask(ctx, request, id));
}
