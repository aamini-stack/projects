# Cline Rules for imdbgraph

## Project Overview

`imdbgraph` is a web application for visualizing IMDb data. It allows users to search for TV shows and view graphs of their episode ratings over time. The primary goal is to provide a clean, interactive interface for exploring the ratings and trends of various shows.

## Monorepo Context

This project is part of the `@aamini` monorepo, which houses personal projects and shared utilities. The monorepo is managed with Turborepo and uses `pnpm` for all dependency management.

**Important**: Always use `pnpm` commands (`pnpm i`, `pnpm exec`, `pnpm run <script>`), not `npm` or `yarn`.

## Project Layout

The monorepo has a structured layout:

-   **Application Code**: `<root>/apps/imdbgraph` (This project and the cwd)
-   **Shared Libraries**: `<root>/libs` (Common utilities and configurations shared across the monorepo)

## Source Code Layout (`src`)

-   `src/actions`: Server-side actions and data fetching logic.
-   `src/assets`: Static assets like images and icons.
-   `src/components`: Reusable UI components (mostly `.tsx` files for React within Astro).
-   `src/lib`: Core application logic, utilities, and type definitions.
    -   `query.ts`: Database query helpers.
    -   `search.ts`: Search-related logic.
    -   `store.ts`: State management.
    -   `types.ts`: TypeScript type definitions.
-   `src/pages`: Astro pages, which define the routes for the application.
    -   `pages/api`: API endpoints.
    -   `pages/ratings`: Dynamic routes for displaying show ratings.
-   `src/styles`: Global CSS and styling files.

## Build and Run Instructions

-   **Install Dependencies**: Run `pnpm install`.
-   **Run Development Server**: To start the dev server for this app, run `pnpm run dev`.
-   **Run Tests**: To run the unit tests (Vitest), use `pnpm run test`.
-   **Run E2E Tests**: To run the E2E UI tests (PlayWright), use `pnpm run e2e`.

## Key Technologies

-   **Framework**: Astro
-   **UI Components**: TailwindCSS with Shadcn UI.
    -   To add new components, use `pnpm dlx shadcn-vue@latest add {component}`.
-   **Testing**: Vitest for unit tests, Playwright for E2E tests.
-   **Build Tool**: Turborepo and pnpm
    - To run unit tests: `pnpm run test`
    - To run E2E tests: `pnpm run e2e`

## Coding Standards

1.  **Import Aliases**: Always use import aliases for cleaner imports (e.g., `from '@/lib/utils'` instead of `from '../../lib/utils'`).
2.  **Programming Style**: Prefer a functional programming approach over object-oriented patterns where applicable.
3.  **React Component Style**: For React components (used within Astro), declare them as standard functions (`function MyComponent() { ... }`), unless the body is a single return statement or the function is nested, in which case an arrow function is acceptable (`const MyComponent = () => (...)`).

