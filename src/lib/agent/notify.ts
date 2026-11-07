import "server-only";

import { after } from "next/server";

import { environment } from "@/configs/environment";
import { escapeHtml, sendMessage } from "@/lib/agent/telegram";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatShortDate } from "@/lib/utils";

export type NotifyEvent = "task.created" | "task.completed";

export type NotifyInput = {
  projectId: string;
  taskId: string;
  event: NotifyEvent;
  actorId?: string | null;
  actorLabel?: string;
  exceptLinkId?: string;
  previousCategoryId?: string;
};

const DEDUPE_MS = 10 * 60 * 1000;
const PAUSED_REASON =
  "Telegram refused the message: the bot was removed from this group or can no longer write there. Add it back, then turn updates on again.";

type Person = { name: string; telegram_username: string | null };

const mention = (person: Person) =>
  person.telegram_username ? `@${escapeHtml(person.telegram_username.replace(/^@/, ""))}` : escapeHtml(person.name);

type MessageInput = {
  event: NotifyEvent;
  projectId: string;
  projectName: string;
  title: string;
  priority: string;
  dueDate: string | null;
  column: string;
  previousColumn?: string;
  actor: string;
  assignees: Person[];
};

function buildMessage(input: MessageInput) {
  const created = input.event === "task.created";
  const heading = `${created ? "•" : "✅"} <b>${created ? "New task" : "Task completed"}</b> in ${escapeHtml(input.projectName)}`;
  const priority = input.priority.charAt(0).toUpperCase() + input.priority.slice(1);
  const column = !created && input.previousColumn ? `${input.previousColumn} → ${input.column}` : input.column;
  const details = [
    `Priority: ${escapeHtml(priority)}`,
    input.dueDate ? `Due: ${escapeHtml(formatShortDate(input.dueDate))}` : null,
    column ? `Column: ${escapeHtml(column)}` : null,
  ].filter(Boolean);

  return [
    heading,
    `<blockquote>${escapeHtml(input.title)}</blockquote>`,
    details.join(" · "),
    `by ${input.actor}`,
    input.assignees.length > 0 ? `assigned to ${input.assignees.map(mention).join(", ")}` : null,
    `<a href="${environment.APP_URL}/projects/${input.projectId}">Open board</a>`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

// Tells the Telegram chats linked to a project about a task event, after the response has been sent.
// A failure here never reaches the user who triggered it.
export function notifyProject(input: NotifyInput) {
  if (!environment.AGENT_ENABLED) return;
  after(() => sendNotifications(input).catch((error) => console.error("notifyProject failed:", error)));
}

async function sendNotifications(input: NotifyInput) {
  const admin = createAdminClient();

  const { data: task } = await admin
    .from("tasks")
    .select("id, title, category_id, priority, due_date")
    .eq("id", input.taskId)
    .eq("project_id", input.projectId)
    .maybeSingle();
  if (!task) return;

  const categoryIds = [task.category_id, input.previousCategoryId].filter((id): id is string => Boolean(id));
  const { data: categories } = await admin.from("categories").select("id, name, key").in("id", categoryIds);
  const category = (id?: string) => categories?.find((c) => c.id === id);
  if (input.event === "task.completed") {
    if (category(task.category_id)?.key !== "done" || category(input.previousCategoryId)?.key === "done") return;
  }

  const flag = input.event === "task.created" ? "notify_task_created" : "notify_task_completed";
  let linksQuery = admin
    .from("agent_links")
    .select("id, bot_id, chat_id")
    .eq("project_id", input.projectId)
    .eq(flag, true)
    .is("revoked_at", null);
  if (input.exceptLinkId) linksQuery = linksQuery.neq("id", input.exceptLinkId);
  const { data: links } = await linksQuery;
  if (!links || links.length === 0) return;

  const [{ data: project }, { data: actorProfile }, { data: assigned }] = await Promise.all([
    admin.from("projects").select("name").eq("id", input.projectId).single(),
    input.actorId
      ? admin.from("profiles").select("name, telegram_username").eq("id", input.actorId).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("task_assignees").select("user_id").eq("task_id", task.id),
  ]);
  const { data: people } = await admin
    .from("profiles")
    .select("name, telegram_username")
    .in("id", (assigned ?? []).map((row) => row.user_id));

  const message = buildMessage({
    event: input.event,
    projectId: input.projectId,
    projectName: project?.name ?? "Kanbo",
    title: task.title,
    priority: task.priority,
    dueDate: task.due_date,
    column: category(task.category_id)?.name ?? "",
    previousColumn: category(input.previousCategoryId)?.name,
    actor: input.actorLabel ? escapeHtml(input.actorLabel) : actorProfile ? mention(actorProfile) : "a teammate",
    assignees: people ?? [],
  });

  await Promise.all(links.map((link) => deliver(admin, link, task.id, input.event, message)));
}

async function deliver(
  admin: ReturnType<typeof createAdminClient>,
  link: { id: string; bot_id: string; chat_id: string },
  taskId: string,
  event: NotifyEvent,
  message: string,
) {
  const log = (status: "sent" | "failed" | "skipped", error?: string) =>
    admin.from("notification_log").insert({ link_id: link.id, task_id: taskId, event, status, error: error?.slice(0, 500) });

  const since = new Date(Date.now() - DEDUPE_MS).toISOString();
  const { data: recent } = await admin
    .from("notification_log")
    .select("id")
    .eq("link_id", link.id)
    .eq("task_id", taskId)
    .eq("event", event)
    .eq("status", "sent")
    .gt("created_at", since)
    .limit(1);
  if (recent && recent.length > 0) {
    await log("skipped", "Already sent in the last 10 minutes");
    return;
  }

  const { data: token } = await admin.rpc("get_agent_bot_token", { p_bot_id: link.bot_id });
  if (!token) {
    await log("failed", "The bot token is not available");
    return;
  }

  const result = await sendMessage(token, link.chat_id, message);
  if (result.ok) {
    await log("sent");
    return;
  }

  await log("failed", result.error);
  const gone = result.status === 403 || (result.status === 400 && /chat not found/i.test(result.error));
  if (gone) {
    await admin
      .from("agent_links")
      .update({ notify_task_created: false, notify_task_completed: false, notify_disabled_reason: PAUSED_REASON })
      .eq("id", link.id);
  }
}
