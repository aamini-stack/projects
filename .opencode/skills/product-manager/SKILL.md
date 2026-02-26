---
name: product-manager
title: product-manager
description: Turn ideas into practical PLAN.md and dependency-aware tasks.json.
compatibility: opencode
---

## Overview

This document defines how an AI agent should take a large feature request and
break it into practical implementation artifacts.

This skill should generate:

1. `PLAN.md`
2. `tasks.json`
3. `NOTES.md` (only when needed; see Notes policy below)

## PLAN.md

PLAN.md should be concise and high-signal: explain the feature, goals,
constraints, and important technical context. Include sources/research used to
make planning decisions.

## tasks.json

tasks.json is a directed acyclic graph of implementation tasks derived from
PLAN.md. Each task should usually map to one focused PR. Break the plan into
discrete, manageable chunks with clear dependencies and clear acceptance
criteria.

**IMPORTANT/CRITICAL RULES**:

1. **DO NOT OVER-DECOMPOSE**. Avoid turning one coherent PR into many micro
   tasks.
2. **PRIORITIZE ACCEPTANCE CRITERIA/TESTS**. Every task must have concrete,
   verifiable outcomes written as executable validation steps.

### Acceptance criteria writing standard (CRITICAL)

Acceptance criteria should read like a test runbook, not a product wish.

- Write each criterion as an action + observation + expected result.
- Prefer imperative language: `Create`, `Commit`, `Push`, `Open`, `Run`,
  `Verify`, `Assert`.
- Name the surface/tool where verification happens when relevant (for example:
  `gh` CLI, GitHub Actions logs, API response, Flux events, Knative resource
  state).
- Include evidence expectations (status name, log line, artifact field, URL,
  resource value, exit code, etc.).
- For logic-heavy tasks, include explicit test-deliverable criteria (for
  example: create/update `*.test.ts` and cover core paths + edge cases).
- Avoid vague outcomes like "works", "is healthy", "is correct", "is
  configured" unless the exact check is spelled out.
- Prefer 3-6 strong criteria per task over many weak criteria.

Use this pattern:

`<Action to perform>. <Where to check>. <Expected observable result>.`

Example style:

- `Commit a change that affects only app-a. Push to a branch and open a PR with gh pr create. Verify in GitHub Actions logs that only app-a build job ran and no other app build job started.`
- `Trigger the deployment workflow for the PR SHA. Check commit statuses via gh api repos/{owner}/{repo}/commits/{sha}/status. Assert preview-deploy transitions pending -> success before e2e starts.`

### Task quality bar

- Clear done condition
- Clear dependencies
- Clear step-by-step verification checks or tests to write/pass
- Usually completable in one focused PR

### Anti-patterns to avoid

- Splitting small work into many microtasks when one PR task is enough
- Missing `acceptance-criteria` or using vague checks like "works as expected"
- Acceptance criteria that state outcomes without saying how to validate them
- Omitting `Sources` in PLAN.md when external behavior/config was researched
- Putting ad-hoc implementation notes inside `tasks.json`
- Writing routine progress logs in `NOTES.md` with no planning value

### Schema

- `id` (ex: 1.0, 1.1, 1.2, 2.1,...)
- `title`
- `description`
- `dependencies` (array of task ids)
- `commitSha` (null until done)
- `done` (false initially)
- `blocked` (false initially)
- `acceptance-criteria`

### tasks.json examples

#### Good: simple-feature-tasks

Request: Add a feature flag to disable user self-signup in production. Reason:
One coherent PR-sized task with concrete verification.

```json
[
	{
		"id": "1.0",
		"title": "Add self-signup feature flag and enforce it in auth flow",
		"description": "Add SELF_SIGNUP_ENABLED with safe defaults in API/UI.",
		"dependencies": [],
		"commitSha": null,
		"done": false,
		"blocked": false,
		"acceptance-criteria": [
			"Set SELF_SIGNUP_ENABLED=false in a non-prod env and deploy the branch. Send a signup API request and verify it returns the documented rejection status/body for disabled self-signup.",
			"With SELF_SIGNUP_ENABLED=false, load the signup page and verify self-signup entry points are hidden or disabled and cannot submit a registration.",
			"Set SELF_SIGNUP_ENABLED=true, redeploy, and complete a new self-signup end-to-end; verify account creation succeeds.",
			"Run relevant API/UI tests in CI and verify the workflow is green before merge."
		]
	}
]
```

#### Good: preview-apps-dag

Request: PR preview environments on AKS with Knative + Flux + CI status + e2e
gating.

Reason: Dependencies are explicit and acceptance criteria are specific.

```json
[
	{
		"id": "1.0",
		"title": "Detect changed apps per PR",
		"description": "Compute changed apps and emit build matrix artifact.",
		"dependencies": [],
		"commitSha": null,
		"done": false,
		"blocked": false,
		"acceptance-criteria": [
			"Commit a change that touches only app-a, push a branch, and open a PR with gh. Verify the emitted matrix artifact contains app-a only with imageTag and previewUrl fields.",
			"Commit a second change in the same PR that touches app-b only. Verify the new run matrix contains app-b only (baseline is previous commit), not app-a.",
			"Commit a docs-only change and push. Verify the matrix artifact is empty and downstream build/deploy jobs are skipped."
		]
	},
	{
		"id": "1.1",
		"title": "Build and push preview images",
		"description": "Build only changed apps and push deterministic preview tags.",
		"dependencies": ["1.0"],
		"commitSha": null,
		"done": false,
		"blocked": false,
		"acceptance-criteria": [
			"Using a PR run where only app-a changed, inspect GitHub Actions logs and verify only app-a Docker build/push steps executed.",
			"Verify pushed image tag matches <app>:pr-<number>-<shortsha> for the PR SHA and is visible in the container registry.",
			"Re-run the same workflow for the same commit and verify the computed tag value is identical."
		]
	}
]
```

#### Good: logic-task-with-explicit-unit-tests

Request: Implement calculator core logic.

Reason: Acceptance criteria include both behavior checks and required unit test
deliverables.

```json
[
	{
		"id": "2.0",
		"title": "Implement calculator core operations",
		"description": "Add add/subtract/multiply/divide logic with input validation.",
		"dependencies": [],
		"commitSha": null,
		"done": false,
		"blocked": false,
		"acceptance-criteria": [
			"Implement add, subtract, multiply, and divide functions and export them from the calculator module.",
			"Handle divide-by-zero with the documented error behavior and verify it by calling divide(10, 0).",
			"Write `calculator.test.ts` with unit tests for add/subtract/multiply/divide and divide-by-zero behavior.",
			"Run calculator unit tests in CI/local and verify all tests pass before merge."
		]
	}
]
```

#### Bad: forbidden-notes-in-task

Reason: Vague acceptance criteria.

```json
{
	"id": "1.2",
	"title": "Configure Flux",
	"description": "Set up Flux",
	"acceptance-criteria": ["FluxCD is healthy"]
}
```

#### Bad: ad-hoc-notes-inside-task

Reason: Ad-hoc implementation notes do not belong inside tasks.json.

```json
{
	"id": "2.1",
	"title": "Wire Flux reconciliation",
	"description": "Add reconciliation trigger after image publish.",
	"dependencies": ["1.1"],
	"commitSha": null,
	"done": false,
	"blocked": false,
	"notes": "Need to ask platform team about service account scope.",
	"acceptance-criteria": [
		"Flux receives reconcile trigger after publish",
		"Relevant tests pass"
	]
}
```

## NOTES.md policy

`NOTES.md` is a rolling implementation journal for information that can affect
sequencing, scope, or planning quality.

Write/update `NOTES.md` between tasks only when there is useful information,
especially:

- Roadblocks (technical, infra, permission, flaky env, missing context)
- Risks discovered during implementation that may require reprioritization
- Findings that may justify rewriting `tasks.json` and/or `PLAN.md`
- Important implementation discoveries likely to help future tasks

Do not add noise. If there is nothing useful to record, do not update
`NOTES.md`.

### Suggested NOTES.md entry shape

Use concise timestamped entries, for example:

```md
## 2026-02-25 - Task 1.2

- Type: Roadblock
- Context: Flux webhook receiver returns 401 in CI only.
- Impact: Blocks task 1.2 completion; tasks 1.3+ should remain blocked.
- Evidence: CI run #1234, notification-controller logs, local repro command.
- Proposed action: Rotate webhook secret and re-run pipeline.
- Replan trigger: If unresolved after 2 attempts, split auth hardening into new
  task 1.2a.
```

### NOTES.md examples

#### Good: notes-roadblocks-and-discoveries

Reason: Captures high-value findings with impact and replanning triggers.

```md
## 2026-02-25 - Task 1.1

- Type: Discovery
- Context: Preview image tags must include short SHA; PR number alone causes
  collisions on reruns.
- Impact: No task split needed; update acceptance checks for 1.1.
- Follow-up: Mention tag format in PLAN implementation notes.

## 2026-02-26 - Task 1.2

- Type: Roadblock
- Context: CI cannot reach Flux webhook endpoint due to network policy.
- Impact: 1.2 blocked; 1.3+ should stay blocked.
- Proposed action: Add temporary allow rule or internal relay.
- Replan trigger: If policy exception is denied, create new task for reconcile
  path redesign.
```

#### Bad: noisy-or-incomplete-notes

Reason: Contains noise and misses impact, evidence, and replan trigger.

```md
## 2026-02-25

- Changed one variable.
- Ran tests.

## 2026-02-26 - Task 1.3

- Deployment failed again.
```
