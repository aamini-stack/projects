# Tech Stack: @aamini Monorepo

## Overview

This is a monorepo for Aria Amini's personal projects, serving as a central hub for development and showcasing various web applications. Each app has relatively the same tech-stack. Any major differences will be documented as exceptions. But overall, each is a web application powered by React, Astro, and Tailwind (More info below).

## Applications

### apps/portfolio (Port 4001)

A professional portfolio website to showcase Aria Amini's skills, experience, and projects to potential employers and collaborators.

### apps/imdbgraph (port 4002)

An interactive data visualization tool for exploring the IMDB movie database. It allows users to search for movies and see relationships between actors, directors, and films in a graph format.

### apps/dota-visualizer (port 4003)

A web application that provides detailed statistics and visualizations for the game Dota 2. It helps players analyze hero performance, matchups, and other in-game data.

## Folder structure

```
aamini
├── apps/
│   ├── dota-visualizer/
│   ├── imdbgraph/
│   └── portfolio/
├── libs/
│   ├── typescript/     # (@aamini/config-typescript): TypeScript common configurations
│   ├── ui/             # (@aamini/ui): Reusable React/ShadcnUI components + styles
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Core Technologies

- **Framework**: Astro for static site generation across all applications
- **Frontend**: React 19 for interactive UI components
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4.x for utility-first styling
- **Build Tools**: turborepo + pnpm
- **Database**: Drizzle ORM for type-safe database manipulations

## Tools

- **Build System**: Turborepo for task orchestration
- **Linting**: oxlint for fast TypeScript linting
- **Formatting**: Prettier with custom plugins
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Deployment**: Vercel for all applications

## Installation & Setup

```bash
# Install all dependencies
pnpm install

# Start development servers
pnpm run dev                # All apps
pnpm --filter portfolio dev # Specific app

# Build all applications
pnpm run build

# Run tests
pnpm run test
pnpm run e2e
```
