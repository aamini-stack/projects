---
name: developer
title: developer
description: Implement one ready task end-to-end with aamini pm, including verification, commit, and task closure.
compatibility: opencode
---

# Developer Skill: Implement and Close Tasks with `aamini pm`

Use this workflow to autonomously select and complete tasks from `tasks.json`
through implementation, verification, commit, and final task logging.

## Goal

- Work one task at a time.
- Pick a ready task yourself using `aamini pm`.
- Keep scope limited to the selected task and its direct CI fallout.
- Finish with a real commit SHA and a proper `aamini pm done` update.
- Use `aamini pm --help` whenever you need command usage details or examples.

## Basic Workflow

1. Select one task autonomously
   - Run `aamini pm next` to list ready tasks.
   - If none are available, run `aamini pm progress`, report no unblocked task,
     and stop.
   - Choose one task (default to the first listed unless there is a clear higher
     priority task).
   - Run `aamini pm show <task-id>` to review requirements and acceptance
     criteria.

2. Implement only the selected task
   - Make focused code changes tied to the task description.
   - Avoid unrelated refactors.
   - If you discover blocking issues, either fix only what is necessary to
     complete the task or mark the task blocked.

3. Validate quality
   - Run targeted checks first while iterating (for example app-level
     lint/typecheck/tests).
   - Run full verification once at the end with `pnpm verify` in the relevant
     app/package.

4. Commit with intent
   - Stage only relevant files.
   - Create a commit with a concise message that explains why the change was
     needed.
   - Capture the commit SHA: `git rev-parse HEAD`.

5. Close task in `tasks.json`
   - Mark done using JSON payload and include summary/notes.

```bash
aamini pm done <<'EOF'
{
  "task": "<task-id>",
  "status": "done",
  "sha": "<commit-sha>",
  "summary": "<short outcome>",
  "notes": "<checks run and validation details>"
}
EOF
```

## Blocked Flow

If you cannot finish due to a real blocker, mark it clearly:

```bash
aamini pm done <<'EOF'
{
  "task": "<task-id>",
  "status": "blocked",
  "summary": "<what is blocked>",
  "notes": "<why blocked and what is needed to unblock>"
}
EOF
```

## Guardrails

- Never mark a task done without a real commit SHA.
- Never work multiple tasks in the same iteration.
- Never update unrelated tasks.
- Never claim checks passed unless you actually ran them.
- Keep notes specific enough that the next engineer can continue from them.
