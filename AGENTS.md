# @aamini-stack Monorepo

This is a monorepo for tanstack webapps. The project uses pnpm workspaces for
package management and turborepo for efficient building/task management.

## General Structure

- Apps in `apps/${APP_NAME}` (ex: apps/imdbgraph)
- Infra/Pulumi code in `packages/infra`

## Tech Stack

- Frameworks: TanStack Start, Vite
- UI: React, Tailwind, Shadcn
- Package Manger: pnpm (CRITICAL: DO NOT USE npm)
- Task Runner: Turborepo for Monorepo support + task management/caching

## CRITICAL RULES

- ALWAYS use pnpm over npm
- Use the caveman skill to minimize output token usage.
- Verify changes frequently with `pnpm verify` (build, lint, format, typecheck,
  test, e2e)
