# Project-Specific Rules

This is {{ appName }}. This is a project contained within a monorepo (@aamini). You have access
to an adjacent e2e project (dota-e2e) that is critical for you to use when iterating/debugging
new features. The test suite contains a simple screenshot test as a default, but
you can add any other tests you may want to as well. 

## 1. Important Rules

- Use pnpm for all dependency management commands.
- Use import aliases. Ex: `"@/lib/utils"` instead of `"../../lib/utils"`
- Run `pnpm verify` to make sure the project still builds + passes checks/tests
- Use `pnpm e2e` to run UI tests. You can check the playwright screenshots
  for validation while iterating on one of my requests. You can also use the browser
- All new features and significant bug fixes must be accompanied by appropriate tests (unit, integration, and/or e2e).
- Use `pnpm run generate-app` at root if you need to create any new applications.
-

## 2. Monorepo Structure

- **`apps/`**: Contains individual applications (e.g., `dota-visualizer`, `imdbgraph`, `portfolio`). Each application should be self-contained within its directory. This directory also contains tests (ex: `dota-visualizer-e2e`)
- **`libs/`**: Contains shared libraries and utilities that can be consumed by multiple applications or other libraries.
  - `libs/eslint/`: Centralized ESLint configurations.
  - `libs/typescript/`: Centralized TypeScript configurations.
