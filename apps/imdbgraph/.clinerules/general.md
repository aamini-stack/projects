# Cline Rules

## App Description

This is imdbgraph.

## Project Structure

imdbgraph is contained within a monorepo (@aamini). This monorepo contains
all my personal projects along with common utils/configs shared among my projects.
All projects/apps are written in Next.js and the monorepo is managed using TurboRepo. All dependency management is done through pnpm and NOT npm or yarn. Use commands like: `pnpm i`, `pnpm exec`, `pnpm dlx`, `pnpm run dev` and **NOT** `npx` or `npm i`.

### Directory Structure

- Main code: `<root>/apps/imdbgraph`
- E2E Playwright Test Suite: `<root>/apps/imdbgraph-e2e`
- Common Library/Config code: `<root>/libs`

## Style Guide

1. Use import aliases. Ex: `"@/lib/utils"` instead of relative imports like `"../../lib/utils"`
2. Prefer functional programming over OOP.
3. Prefer `function x() { ... }` over `const x = () => {...}` for react components, unless the body is
   only a single return.
4. Write components using modern TailwindCSS and Shadcn components. Use `pnpm dlx shadcn@latest add {component}` to install any new components you need. Example: `pnpm dlx shadcn@latest add button`.
