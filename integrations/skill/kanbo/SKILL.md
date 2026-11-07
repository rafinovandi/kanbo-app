---
name: kanbo
description: Add, find and update tasks on a Kanbo project board from a Telegram chat. Use when someone sends "link kanbo CODE", or asks to add, list, move or complete tasks for their project (including from a photo of a to-do list).
metadata: { "openclaw": { "requires": { "env": ["KANBO_API_URL"] } } }
---

# Kanbo

Kanbo is a kanban task manager. Each Telegram chat is linked to exactly one Kanbo project, and the helper script `kanbo.mjs` (in this skill's folder: `{baseDir}/kanbo.mjs`) does every call. Reply in the language the user writes in.

## How to run the helper

Always pass the **numeric Telegram chat id of the current chat** with `--chat`. Anything the user wrote goes in a JSON file, never in a command-line argument. Each step is its own command:

1. Write the JSON with your **file-writing tool** to the fixed path `/home/discloud/.openclaw/workspace/kanbo_input.json` (not `/tmp`).
2. Run the helper as a **separate command** that points at that file:

```bash
{baseDir}/kanbo.mjs preview-tasks --chat -1001234567890 --input /home/discloud/.openclaw/workspace/kanbo_input.json
```

Example content of the file:

```json
{
  "tasks": [
    {
      "title": "Revise the hero section",
      "priority": "high",
      "dueDate": "2026-11-12",
      "category": "To Do",
      "assignees": ["Alya"]
    }
  ],
  "sender": "Rafi"
}
```

Run the helper directly (it is executable), never through `node`. Do not write the file with `node -e`, `echo` or a heredoc, and do not chain commands with `&&`, `;` or pipes. One command per step. Commands that need no JSON (`context`, `link --code`, `unlink`) are run on their own without `--input`.

The helper prints JSON. `"ok": true` means it worked; otherwise read `error` and `message` and explain it to the user in plain words. Never show or repeat any token.

**"Approval required" is not a failure.** If the result says "Approval required" or that the approval request was sent to Telegram DMs, the command did not run yet: the owner has to approve it. Stop, tell the user to approve it in their DM, and do not run that command again until they reply.

**Never repeat a command that failed.** Each run may need the owner's approval, so retrying floods them with requests. After a failure, read the message, fix the cause once (for example rewrite the input file) or tell the user what went wrong, and stop. Never run the same command more than twice in a row.

## 1. Linking a chat

When someone sends `link kanbo ABCD1234` (the code is exactly 8 letters and digits), pass the code with `--code`. Only do so after checking that it matches `^[A-Za-z0-9]{8}$`; if it does not, ask for the code again instead of running anything:

```bash
{baseDir}/kanbo.mjs link --chat <chatId> --code ABCD1234
```

On success, say which project the chat is now linked to. If the code is invalid or expired, tell them a project admin can generate a new one in Kanbo under the project's ⋯ menu → Connect Chat (codes last 10 minutes and work once). To disconnect a chat, run `unlink --chat <chatId>`.

If any command answers `not_linked`, this chat has no project yet: explain how to link it and stop.

## 2. Adding tasks (always preview first)

1. Run `context --chat <chatId>` once per conversation to learn the project name, the board columns (`categories`) and the members.
2. Extract tasks from the text or photo. Each task has `title` (required), and optionally `description`, `priority` (`low`, `medium`, `high`), `dueDate` (`YYYY-MM-DD`; convert words like "tomorrow" using today's date, and ask if it is ambiguous), `category` (a column name from the context) and `assignees` (member names or emails from the context). Leave out anything the user did not say. **If the user did not give a task title, ask for it. Never use the sentence of the command itself (for example "add a task") as the title.**
3. Write `{"tasks":[…],"sender":"<the sender's name>"}` to the input file and run `preview-tasks` with `--input`. Nothing is saved yet.
4. Show the result as a numbered list, one line per task, for example:
   `1. Revise the hero section · High · 12 Nov · @Alya · To Do`
   Show every item in `warnings` (an unknown assignee or column, a date that was ignored). End with: reply "ok" to save, or tell me what to change.
5. If the user corrects something ("make 2 high"), change that task and run `preview-tasks` again.
6. Only after the user clearly confirms, run `create-tasks` with **exactly the same JSON** that was last previewed (the same input file). Then reply with the number of tasks created and the board link (`url`).

Never run `create-tasks` or `update-task` in the same turn as the preview. They may only run after a **new message from the user** that approves the preview. The helper refuses with `preview_required` when this exact input was not previewed in the last 30 minutes: preview it again, show it, and wait for the user's reply.

## 3. Finding, moving and completing tasks

1. Find the task with `list` (`--status open`, `done` or `all`; optional input file `{"q":"words from the title"}` via `--input`). If several tasks match, ask which one.
2. Write only the fields to change to the input file, then run `preview-update --chat <chatId> --task <taskId> --input <file>`: `category`, `priority`, `dueDate`, `assignees`. To complete a task, set `category` to the column named Done.
3. Show the `changes` (for example "Revise the hero section: To Do → Done") and ask for confirmation.
4. After confirmation, run `update-task` with the same input file.

## Rules

- Only tasks of the linked project are reachable; you cannot choose another project.
- Do not invent tasks, assignees or dates. If the photo is unreadable, say so.
- One preview per request is enough; do not ask for confirmation twice.
- Never reveal tokens, the links file or API addresses.
