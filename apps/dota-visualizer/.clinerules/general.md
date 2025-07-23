# Cline Rules

## App Description

This is dota-visualizer. An app with the goal of visualizing stats for Dota 2 heroes.

## Project Structure

dota-visualizer is contained within a monorepo (@aamini). This monorepo contains
all my personal projects along with common utils/configs shared among my projects.
All projects/apps are written in Next.js and the monorepo is managed using TurboRepo. All dependency management is done through pnpm and NOT npm or yarn. Use commands like: `pnpm i`, `pnpm exec`, `pnpm dlx`, `pnpm run dev` and **NOT** `npx` or `npm i`.

### Directory Structure

- Main code: `<root>/apps/dota-visualizer`
- E2E Playwright Test Suite: `<root>/apps/dota-visualizer-e2e`
- Common Library/Config code: `<root>/libs`

## Feature request workflow

I want you to follow a workflow similar to this when working on any major feature requests.
Call this the "Aria LLM workflow" and announce it so I know you're following it.
And announce each step.

Aria LLM Workflow:

1. Before any major feature work, begin by planning an appropriate testing strategy with me. This will help you succesfully iterate/debug the requested feature.
2. If working on a UI feature, also run `pnpm run dev` and open the app in a browser window.
3. Begin working on the feature. While working, ignore lint/type rules until the very end.
4. Once done, fix all previous lint/type rules.
5. Run `pnpm run verify` one last time.
6. Run `cd .. && pnpm run e2e` to run e2e tests.

## Core Principles

### Architecture

1. **Default to Server Components:** Build components as Server Components by default. Only use the `'use client'` directive for components that require interactivity (state, effects, event listeners), and place them as deep in the component tree as possible.
2. **Isolate Server-Only Code:** Use the `server-only` package in files containing sensitive logic (e.g., database access, API keys) to prevent them from being accidentally imported into Client Components.
3. **Secure Data Flow:** When passing props from Server to Client Components, only send the necessary, sanitized data. Avoid passing entire database objects or sensitive information.
4. **UI/Styling:** Write components using modern TailwindCSS and Shadcn components. Use `pnpm dlx shadcn@latest add {component}` to install any new components you need. Example: `pnpm dlx shadcn@latest add button`.

### Data & State Management

1. **Use Server Actions for Mutations:** Handle all data mutations (creates, updates, deletes) with Server Actions. This is the idiomatic and secure way to handle data modification in the App Router.
2. **Cache Aggressively:** Use `React.cache` to memoize data-fetching functions. This prevents redundant database queries or API calls when the same data is requested multiple times in a single render.
3. **Implement Optimistic UI:** Use the `useOptimistic` hook to update the UI instantly in response to user actions, before the server has confirmed the change. This makes the application feel significantly more responsive.
4. **`useEffect` is for External Sync Only:** Do not use `useEffect` for data fetching. Its primary purpose is to synchronize your component with an _external_ system, such as a third-party widget, a browser API, or a manually managed subscription.

### Performance Optimization

1. **Master `next/image` and `next/script`:**
   - Always use `<Image>` for automatic optimization, resizing, and modern format delivery. Configure `remotePatterns` in `next.config.js` for security.
   - Use `<Script>` with the appropriate `strategy` (`lazyOnload`, `afterInteractive`) to load third-party scripts without blocking page rendering.

2. **Leverage `Suspense` for Streaming:** Wrap slow-loading components in `<Suspense>` with a fallback (like a skeleton loader). This allows for progressive rendering and improves the user's perceived performance.

3. **Analyze Your Bundles:** Regularly use `@next/bundle-analyzer` to inspect your JavaScript bundles. Identify and optimize or replace large dependencies to keep your application lean.

### Style Guide

1. Use import aliases. Ex: `"@/lib/utils"` instead of relative imports like `"../../lib/utils"`
2. Prefer functional programming over OOP.
3. Prefer `function x() { ... }` over `const x = () => {...}` for react components, unless the body is
   only a single return.
