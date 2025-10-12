# AGENTS.md

This file provides guidance to agentic LLMs when working with code in this
repository.

## pc-tune-ups

A simple website for my friend's PC repair store. Original website:
https://afcom-inc.com/

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `pnpm dev`              | Starts local dev server at `localhost:4321`     |
| `pnpm build`            | Build your production site to `./dist/`         |
| `pnpm typecheck`        | Run TypeScript type checking                    |
| `pnpm format`           | Run Prettier to format                          |
| `pnpm lint`             | Run Oxlint linting rules (Replaces ESLint)      |
| `pnpm test:unit`        | Run unit tests with Vitest                      |
| `pnpm test:integration` | Run integration tests                           |
| `pnpm e2e`              | Run end-to-end tests with Playwright            |
| `pnpm e2e:update`       | Update Playwright test screenshots              |
| `pnpm verify`           | Run all checks (build, lint, format, typecheck, |
|                         | test, e2e)                                      |

## 🏗️ Architecture

This is an Astro 5 project with React integration. Key architectural decisions:

- **Framework**: Astro with React
- **Styling**: TailwindCSS 4.x
- **Package Manager**: pnpm (IMPORTANT: DO NOT USE npm or yarn)
- **Path Mapping**: `#/*` maps to `./src/*` for clean imports

## 🧪 Unit Tests

- `unit`: Plain node environment for simple unit tests involving pure functions.
- `integration`:
  - Database tests with testcontainers.
  - UI component tests with vitest browser mode.

## Shadcn

New Shadcn components can be installed with this command:
`pnpm dlx shadcn@latest add $COMPONENT_NAME`
