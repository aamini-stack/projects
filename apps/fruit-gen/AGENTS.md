# App Overview

**fruit-gen** is a React-based fruit discovery web application built with Astro.
The app helps users discover new fruits, track weekly fruit goals, and manage
favorites. It runs on port 4004 and uses static site generation with
prerendering.

## Workspace Integration

Part of `@aamini` monorepo with shared TypeScript config
(`@aamini/config-typescript/astro`) and UI library (`@aamini/ui`).

## Tech Stack

- **Package Manager**: pnpm. **IMPORTANT**: USE pnpm NOT npm
- **Framework**: Astro 5 with static site generation (`prerender: true`)
- **Frontend**: React 19 with TypeScript 5.9
- **Styling**: Tailwind CSS 4.x via Vite plugin
- **Deployment**: Vercel adapter configured for server output
- **Testing**: Vitest (unit + browser tests) + Playwright (E2E) with screenshot
  testing

## Styling

Common base shadcn styles located in @aamini/ui package (../../packages/ui)
