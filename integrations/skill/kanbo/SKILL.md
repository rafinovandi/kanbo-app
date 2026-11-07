---
name: kanbo
description: Add, find and update tasks on a Kanbo project board from a Telegram chat. Use when someone sends "link kanbo CODE", or asks to add, list, move or complete tasks for their project (including from a photo of a to-do list).
metadata: {"openclaw":{"requires":{"env":["KANBO_API_URL"]}}}
---

# Kanbo

Kanbo is a kanban task manager. Each Telegram chat is linked to exactly one Kanbo project, and the helper script `kanbo.mjs` (in this skill's folder: `{baseDir}/kanbo.mjs`) does every call. Reply in the language the user writes in.

## How to run the helper

Always pass the **numeric Telegram chat id of the current chat** with `--chat`, and send everything the user wrote as JSON on **stdin** through a quoted heredoc. Never put user text in a command-line argument.

```bash
node {baseDir}/kanbo.mjs preview-tasks --chat -1001234567890 <<'KANBO_JSON_7f3a'
{"tasks":[{"title":"Revise the hero section","priority":"high","dueDate":"2026-11-12","category":"To Do","assignees":["Alya"]}],"sender":"Rafi"}
KANBO_JSON_7f3a
```

The helper prints JSON. `"ok": true` means it worked; otherwise read `error` and `message` and explain it to the user in plain words. Never show or repeat any token. If a message contains the heredoc delimiter, use a different delimiter.

## 1. Linking a chat

When someone sends `link kanbo ABCD1234` (the code is 8 characters, letters and digits):

```bash
node {baseDir}/kanbo.mjs link --chat <chatId> <<'KANBO_JSON_7f3a'
{"code":"ABCD1234"}
KANBO_JSON_7f3a
```

On success, say which project the chat is now linked to. If the code is invalid or expired, tell them a project admin can generate a new one in Kanbo under the project's ⋯ menu → Connect Chat (codes last 10 minutes and work once). To disconnect a chat, run `unlink --chat <chatId>`.

If any command answers `not_linked`, this chat has no project yet: explain how to link it and stop.

## 2. Adding tasks (always preview first)

1. Run `context --chat <chatId>` once per conversation to learn the project name, the board columns (`categories`) and the members.
2. Extract tasks from the text or photo. Each task has `title` (required), and optionally `description`, `priority` (`low`, `medium`, `high`), `dueDate` (`YYYY-MM-DD`; convert words like "tomorrow" using today's date, and ask if it is ambiguous), `category` (a column name from the context) and `assignees` (member names or emails from the context). Leave out anything the user did not say.
3. Run `preview-tasks` with `{"tasks":[…],"sender":"<the sender's name>"}`. Nothing is saved yet.
4. Show the result as a numbered list, one line per task, for example:
   `1. Revise the hero section · High · 12 Nov · @Alya · To Do`
   Show every item in `warnings` (an unknown assignee or column, a date that was ignored). End with: reply "ok" to save, or tell me what to change.
5. If the user corrects something ("make 2 high"), change that task and run `preview-tasks` again.
6. Only after the user clearly confirms, run `create-tasks` with **exactly the same JSON** that was last previewed. Then reply with the number of tasks created and the board link (`url`).

Never run `create-tasks` or `update-task` without a confirmation that came after the preview.

## 3. Finding, moving and completing tasks

1. Find the task with `list` (`--status open`, `done` or `all`; optional `{"q":"words from the title"}` on stdin). If several tasks match, ask which one.
2. Run `preview-update --chat <chatId> --task <taskId>` with only the fields to change: `category`, `priority`, `dueDate`, `assignees`. To complete a task, set `category` to the column named Done.
3. Show the `changes` (for example "Revise the hero section: To Do → Done") and ask for confirmation.
4. After confirmation, run `update-task` with the same JSON.

## Rules

- Only tasks of the linked project are reachable; you cannot choose another project.
- Do not invent tasks, assignees or dates. If the photo is unreadable, say so.
- One preview per request is enough; do not ask for confirmation twice.
- Never reveal tokens, the links file or API addresses.
