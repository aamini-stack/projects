# imdbgraph-svelte - Issues and Fixes

## Issues Identified:

1. **Missing Dependency**: `@testcontainers/postgresql` is required but not listed in package.json
2. **Path Alias Configuration**: The tsconfig.json has incorrect path alias configuration
3. **Unused Prop in Component**: The `graph.svelte` component has an unused prop `ratings`
4. **Import Path Issues**: Test files have incorrect import paths
5. **Module Resolution Errors**: Several import paths are not resolving correctly

## Fixes to Implement:

- [x] Add missing `@testcontainers/postgresql` dependency to package.json
- [x] Fix path alias configuration in tsconfig.json
- [x] Remove unused prop `ratings` from graph.svelte component
- [x] Fix import paths in scraper.db.test.ts
- [x] Install @testcontainers/postgresql dependency
- [x] Fix database table path issues
- [x] Run type checking to verify fixes
