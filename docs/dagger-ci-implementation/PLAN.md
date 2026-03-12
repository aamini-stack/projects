# Dagger CI Implementation Plan

## Goal

Move CI orchestration out of GitHub Actions and into one Dagger entrypoint so
Actions becomes the trigger and credentials layer only. The Dagger module should
own changed-app detection, lane construction, deploy behavior, and the final CI
summary.

## Current State

- `.github/workflows/ci.yml` currently orchestrates four concerns directly in
  Actions: quality checks, integration tests, changed-app detection, and
  Vercel-backed e2e deployment.
- `dagger/src/index.ts` is only a stub, so the Dagger migration is effectively a
  greenfield CI module rather than a refactor of an existing Dagger pipeline.
- Root scripts already provide the command surfaces the pipeline should reuse:
  `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm test:unit`,
  `pnpm typecheck`, `pnpm test:integration`, `pnpm e2e`, and
  `pnpm e2e:staging`.
- The repo already contains infra rendering logic in `packages/infra`, but this
  worktree does not yet contain Dagger publish helpers for image, chart, or
  GitOps publication.

## Target Shape

Expose one Dagger function, `ci`, that accepts GitHub event context and returns
machine-readable lane results. The function should build three top-level lanes:

- `quality`: `build`, `lint`, `format`, `test:unit`, and `typecheck` as
  independent parallel branches
- `integration`: Playwright/browser-capable test environment for
  `pnpm test:integration`
- `deploy`: changed-app deploy/publish work followed by changed-app e2e

Each lane should emit structured status details so GitHub Actions can log a
single summarized result without re-implementing orchestration logic.

## Delivery Strategy

Implement this in two layers instead of trying to jump straight from the
current workflow to the final publish model:

1. Build Dagger parity with the current workflow.
   This means changed-app detection, quality/integration execution, and the
   existing Vercel-backed e2e deployment all move behind the Dagger `ci`
   function.
2. Extend the deploy lane to support the desired long-term publish model.
   The draft design calls for image publish plus GitOps/chart publication, but
   that plumbing does not exist in this worktree yet. Treat it as an explicit
   implementation phase, not an assumption.

This sequence keeps CI consolidation moving while avoiding a large speculative
publish rewrite in the first PR.

## Scope

In scope:

- One Dagger CI entrypoint with typed input/output
- Shared container/bootstrap logic for pnpm, turbo, and Playwright-capable runs
- Changed-app detection based on the GitHub event base/head refs
- Per-lane structured summaries and explicit skip reporting
- GitHub Actions simplification to one thin Dagger job

Out of scope for the first migration slice:

- Waiting for real rollout completion before e2e
- Reworking app build/test scripts
- Designing preview cleanup or stale-environment lifecycle handling

## Risks And Decisions

- The largest planning risk is deploy-surface ambiguity. The current workflow
  deploys to Vercel for e2e, while the draft target describes registry,
  chart, and GitOps publication. The implementation plan therefore separates
  parity from extension so the first migration can finish cleanly.
- Changed-app detection must be reliable for both `pull_request` and `push` to
  `main`; otherwise deploy and e2e skips will be wrong.
- Dagger needs a consistent way to surface partial failures. The quality lane
  should preserve isolated command failures rather than collapsing into one
  combined turbo invocation.

## Validation Strategy

- Validate the Dagger API locally against both PR-like and `main`-like inputs.
- Verify changed-app selection against single-app, multi-app, and docs-only
  diffs.
- Push a branch and confirm GitHub Actions only runs the thin Dagger workflow
  while the Dagger summary still shows the full CI graph outcomes.

## Sources

- Initial design note: [`docs/plan-dagger.md`](/home/aamini.linux/projects/.worktrees/ci/docs/plan-dagger.md)
- Current workflow: [`.github/workflows/ci.yml`](/home/aamini.linux/projects/.worktrees/ci/.github/workflows/ci.yml)
- Dagger module scaffold: [`dagger/src/index.ts`](/home/aamini.linux/projects/.worktrees/ci/dagger/src/index.ts)
- Root CI scripts: [`package.json`](/home/aamini.linux/projects/.worktrees/ci/package.json)
- Existing e2e helper: [`scripts/src/e2e.ts`](/home/aamini.linux/projects/.worktrees/ci/scripts/src/e2e.ts)
- Existing infra rendering surface: [`packages/infra/src/gitops/render.ts`](/home/aamini.linux/projects/.worktrees/ci/packages/infra/src/gitops/render.ts)
