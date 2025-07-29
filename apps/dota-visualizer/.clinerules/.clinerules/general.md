# Cline Rules

## App Description

This is dota-visualizer.

## Project Structure

dota-visualizer is contained within a monorepo (@aamini). This monorepo contains
all my personal projects along with common utils/configs shared among my projects.
All projects/apps are written in Next.js and the monorepo is managed using TurboRepo. All dependency management is done through pnpm and NOT npm or yarn. Use commands like: `pnpm i`, `pnpm exec`, `pnpm dlx`, `pnpm run dev` and **NOT** `npx` or `npm i`.

### Directory Structure

- Main code: `<root>/apps/dota-visualizer`
- E2E Playwright Test Suite: `<root>/apps/dota-visualizer-e2e`
- Common Library/Config code: `<root>/libs`

## Feature request workflow

I want you to follow a workflow similar to this when implementing any major feature requests.

Before any major feature work, begin by first stopping to discuss testing strategy with me. This will help you succesfully iterate/debug the requested feature. The main testing strategies will be:

1. No tests. Only use this for very simple features.
2. Unit Tests. Use this for any non-UI / logic features. If writing a new feature and there are no tests, write some unit tests first and have me evaluate the tests before you begin implementing the feature. While working on the feature, use `pnpm run verify` to then run the tests and then fix any issues that arise.
3. Browser testing. Launch `pnpm run dev` and open the app in a browser window and use that to debug.

## Style Guide

1. Use import aliases. Ex: `"@/lib/utils"` instead of relative imports like `"../../lib/utils"`
2. Prefer functional programming over OOP.
3. Prefer `function x() { ... }` over `const x = () => {...}` for react components, unless the body is
   only a single return.
4. Write components using modern TailwindCSS and Shadcn components. Use `pnpm dlx shadcn@latest add {component}` to install any new components you need. Example: `pnpm dlx shadcn@latest add button`.
