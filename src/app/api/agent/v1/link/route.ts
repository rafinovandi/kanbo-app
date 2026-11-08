import { reply, withAuth } from "@/lib/agent/http";
import { linkChat, unlinkChat } from "@/lib/agent/link-service";

export async function POST(request: Request) {
  return reply(await linkChat(request));
}

export async function DELETE(request: Request) {
  return withAuth(request, unlinkChat);
}
