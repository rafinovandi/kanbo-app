import { environment } from "@/configs/environment";
import { buildSkillZip } from "@/lib/agent/skill-zip";

export async function GET() {
  if (!environment.AGENT_ENABLED) return new Response(null, { status: 404 });

  const zip = await buildSkillZip();
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="kanbo-skill.zip"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
