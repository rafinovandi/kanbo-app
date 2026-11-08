import { withAuth } from "@/lib/agent/http";
import { getContext } from "@/lib/agent/project-context";

export async function GET(request: Request) {
  return withAuth(request, getContext);
}
