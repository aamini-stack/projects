# AGENTS.md

This file provides guidance to agentic LLMs when working with code in this
repository.

# @aamini Monorepo

This document outlines the structure of the @aamini monorepo and provides a
brief overview of the common packages used across various applications. The
monorepo is organized into `apps/` for individual applications and `packages/`
for shared libraries and configurations. This structure promotes code reuse,
simplifies dependency management, and ensures consistency across projects.

## Build Tools & Package Management

This monorepo uses **pnpm** as the package manager and **Turbo** as the build
system. When working with this codebase:

- **Always use `pnpm`** for installing dependencies and running scripts (e.g.,
  `pnpm install`, `pnpm add <package>`), never `npm` or `yarn`.
- **Use Turbo for builds and tasks** via `pnpm` scripts (e.g., `pnpm build`,
  `pnpm dev`, `pnpm test`). Turbo handles caching and parallelization across the
  monorepo workspace.
- The workspace is configured with pnpm workspaces, allowing packages to depend
  on each other efficiently.

## Packages

Here's a summary of the common packages located in the `packages/` directory:

### `config-testing`

This package likely contains shared testing configurations and utilities for
applications within the monorepo. It helps standardize testing environments and
practices.

### `config-typescript`

This package probably provides standardized TypeScript configurations for
different types of projects (e.g., Astro, React, libraries) within the monorepo,
ensuring consistent type-checking and compilation settings.

### `infra`

This package is expected to contain infrastructure-as-code definitions or
deployment scripts, possibly using tools like Pulumi (given `Pulumi.prod.yaml`
and `Pulumi.yaml` files are present in `packages/infra`). It centralizes
infrastructure management for the monorepo's applications.

### `ui`

This package likely houses a shared UI component library, providing reusable UI
elements and styles that can be consumed by various applications in the
monorepo.

### `ui-neobrutalist`

This package appears to be another UI component library, possibly with a
specific "neobrutalist" design aesthetic, offering a distinct set of UI
components or themes.

### `utils`

This package is a general-purpose utility library, containing common helper
functions, types, or small modules that are frequently used across different
applications and packages within the monorepo.
