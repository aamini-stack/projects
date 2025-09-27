# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                             |
| :---------------------- | :------------------------------------------------- |
| `pnpm install`          | Installs dependencies                              |
| `pnpm dev`              | Starts local dev server at `localhost:4000`        |
| `pnpm build`            | Build your production site to `./dist/`            |
| `pnpm typecheck`        | Run TypeScript type checking                       |
| `pnpm lint`             | Run oxlint with type-aware checking                |
| `pnpm format`           | Check code formatting with Prettier                |
| `pnpm format:fix`       | Fix code formatting with Prettier                  |
| `pnpm test:unit`        | Run unit tests with Vitest                         |
| `pnpm test:integration` | Run integration tests                              |
| `pnpm e2e`              | Run end-to-end tests with Playwright               |
| `pnpm e2e:update`       | Update Playwright test snapshots                   |
| `pnpm verify`           | Run all checks (LINT, typecheck, build, test, e2e, |
|                         | and format).                                       |

## 🏗️ Architecture

This is an Astro 5 project with React integration. Key architectural decisions:

- **Framework**: Astro with React support for interactive components
- **Styling**: TailwindCSS 4.x for utility-first CSS
- **Package Manager**: pnpm (IMPORTANT: DO NOT USE npm or yarn)
- **Node Version**: Requires Node.js >=22
- **TypeScript**: Strict configuration with comprehensive linting rules
- **Path Mapping**: `#/*` maps to `./src/*` for clean imports

## 🧪 Testing

- **Unit Tests**: Vitest with two test projects:
  - `unit`: Plain node environment for simple unit tests
  - `integration`: Groups integration tests involving either database operations
    using docker through testcontainers, or UI component tests using vitest
    browser mode.
  - Runs on `localhost:4000` in development

## UI/Styling (ShadCN)

- Use the common UI library (@aamini/ui) for reusable components. Install any
  new components by cd'ing into `<rootDir>/packages/ui` and running
  `pnpm shadcn $COMPONENT_NAME` (ex: `pnpm shadcn button`).
- Use tailwind styling for any other changes that need to be made to any of the
  UI elements.
