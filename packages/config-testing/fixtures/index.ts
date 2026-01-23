/**
 * Shared testing fixtures for Vitest
 *
 * MSW fixtures are safe to import in both server and browser environments.
 * Database fixtures should be imported directly from
 * '@aamini/config-testing/fixtures/database' to avoid bundling Node.js-only
 * dependencies in browser tests.
 *
 * @example
 * 	;```typescript
 * 	// For browser tests - use this barrel import
 * 	import { createMswBrowserFixture } from '@aamini/config-testing/fixtures'
 *
 * 	// For server tests with database - use direct imports
 * 	import { createMswServerFixture } from '@aamini/config-testing/fixtures'
 * 	import { createPostgresFixture } from '@aamini/config-testing/fixtures/database'
 * 	```
 */

// MSW fixtures (safe for both server and browser)
export {
	createMswBrowserFixture,
	createMswServerFixture,
	type MswBrowserFixture,
	type MswServerFixture,
} from './msw.js'

// Re-export database types only (implementation must be imported directly)
// This avoids bundling Node.js-only deps in browser tests
export type {
	Database,
	DatabaseFixture,
	PostgresFixtureOptions,
} from './database.js'
