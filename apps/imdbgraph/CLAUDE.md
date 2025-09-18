# App Overview

**imdbgraph** is a React-based app for visualizing ratings data from imdb.

## Workspace Integration

Part of `@aamini` monorepo with shared UI library (`@aamini/ui`).

## Tech Stack

- **Package Manager**: pnpm. **IMPORTANT**: USE pnpm NOT npm
- **Framework**: Astro 5 with static site generation (`prerender: true`)
- **Frontend**: React 19 with TypeScript 5.9
- **Styling**: Tailwind CSS 4.x via Vite plugin
- **Deployment**: Vercel adapter configured for server output
- **Testing**: Vitest (unit + browser tests) + Playwright (E2E) with screenshot
  testing

## Styling

Common base shadcn styles located in @aamini/ui package (../../packages/ui).

## New Components

To add new Shadcn components to the app, use
`pnpm dlx shadcn@canary add [COMPONENT]`.
