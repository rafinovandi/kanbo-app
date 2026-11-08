import { withAuth } from "@/lib/agent/http";
import { createTasks, listTasks } from "@/lib/agent/task-service";

export async function GET(request: Request) {
  return withAuth(request, (ctx) => listTasks(ctx, request));
}

export async function POST(request: Request) {
  return withAuth(request, (ctx) => createTasks(ctx, request));
}
