# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                             |
| :----------------       | :--------------------------------------------------|
| `pnpm install`          | Installs dependencies                              |
| `pnpm dev`              | Starts local dev server at `localhost:${APP_PORT}` |
| `pnpm build`            | Build your production site to `./dist/`            |
| `pnpm typecheck`        | Run TypeScript type checking                       |
| `pnpm check`            | Run biome to lint + format                         |
| `pnpm test:unit`        | Run unit tests with Vitest                         |
| `pnpm test:integration` | Run integration tests                              |
| `pnpm e2e`              | Run end-to-end tests with Playwright               |
| `pnpm e2e:update`       | Update Playwright test snapshots                   |
| `pnpm verify`           | Run all checks (check, typecheck, build, test, e2e)|

## 🏗️ Architecture

This is an Astro 5 project with React integration. Key architectural decisions:

- **Framework**: Astro with React support for interactive components
- **Styling**: TailwindCSS 4.x for utility-first CSS
- **Package Manager**: pnpm (required - see packageManager field)
- **Node Version**: Requires Node.js >=22
- **TypeScript**: Strict configuration with comprehensive linting rules
- **Path Mapping**: `#/*` maps to `./src/*` for clean imports

## 🧪 Testing

- **Unit Tests**: Vitest with two test projects:
  - `unit`: Plain node environment for simple unit tests
  - `integration`: Integration tests involving either database operations using ad ad asf 
  - Runs on `localhost:4321` in development
  - Uses screenshot testing with custom CSS
  - Automatic dev server startup for local testing

## 🔧 Development Tools

- **Linting**: biome with type-aware checking and zero warnings tolerance
- **Formatting**: Prettier with plugins for Astro, JSDoc, import organization,
  and TailwindCSS

## ⚡ Quick Start

1. Install dependencies: `pnpm install`
2. Start development: `pnpm dev`
3. Run all checks before committing: `pnpm verify`
