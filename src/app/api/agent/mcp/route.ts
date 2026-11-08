import { handleMcp } from "@/lib/agent/mcp";

export async function POST(request: Request) {
  return handleMcp(request);
}

const notAllowed = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
export const GET = notAllowed;
export const DELETE = notAllowed;
