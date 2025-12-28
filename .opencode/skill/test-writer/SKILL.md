---
name: test-driven-development
description: Writing unit, integration, or E2E for any @aamini-stack app/project
compatibility: opencode
metadata:
  audience: developers
  frameworks: vitest, vitest-browser, playwright, drizzle, msw
---

## What I do

- Assist with writing high quality tests for any accompanying feature work.
- Make sure all tests provide value and follow repository standards.
- Write unit, integration, and E2E tests depending on the feature/granularity.

## When to use me

Use this skill when you are doing TDD or feature work and need assistance
writing high quality tests.

## Test Writing Guidelines

- **Arrange-Act-Assert pattern**: Set up data, execute action, verify result
- **One assertion per test** when possible, keep tests focused
- **Mock external dependencies** (APIs, databases) for fast, reliable tests
- **Test edge cases**: empty results, errors, invalid inputs
- **Keep tests isolated**: each test should be independent
- **Use descriptive test names** that explain what is being tested
- **Group related tests** with `describe()` blocks
- **Use `test.skip()`** for tests under development
- **Clean up after tests** (test extensions handle this automatically)
- **Use `beforeEach()`** for setup that repeats for each test

## Test Commands

Run tests from the app directory (e.g., `cd apps/paas`):

| Command                 | Action                                  |
| :---------------------- | :-------------------------------------- |
| `pnpm test:unit`        | Run unit tests                          |
| `pnpm test:integration` | Run integration tests (browser, server) |
| `pnpm e2e`              | Run E2E tests                           |
| `pnpm e2e:update`       | Update E2E screenshots                  |

## Test Projects (Vitest)

### Unit Tests (`*.test.unit.ts`)

- Plain node environment for pure functions
- No external dependencies (network, database, browser)
- Fast, isolated tests
- Test your own business logic, not library functions

Example (rate limiter with fake timers):

```ts
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

const TEST_IP = '192.168.1.1'
let limiter: RateLimiter

beforeEach(() => {
	limiter = new RateLimiter()
	vi.useFakeTimers()
	vi.setSystemTime(0)
})

afterEach(() => {
	vi.useRealTimers()
})

describe('RateLimiter', () => {
	test('Block after limit is reached', () => {
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 1 })
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 0 })
		expect(limiter.consume(TEST_IP)).toEqual({ success: false, retryAfter: 15 })
		vi.advanceTimersByTime(15 * 60 * 1000 + 1)
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 0 })
	})

	test('Refill tokens after cooldown', () => {
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
		vi.advanceTimersByTime(15 * 60 * 1000 + 1)
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
	})

	test("Don't fill tokens before window passes", () => {
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 2 })
		vi.advanceTimersByTime(14 * 60 * 1000)
		expect(limiter.consume(TEST_IP)).toEqual({ success: true, remaining: 1 })
	})

	test('Handling multiple IPs independently', () => {
		const ip1 = '192.168.1.1'
		const ip2 = '192.168.1.2'
		expect(limiter.consume(ip1)).toEqual({ success: true, remaining: 2 })
		expect(limiter.consume(ip2)).toEqual({ success: true, remaining: 2 })
	})
})
```

### Server Tests (`*.test.ts`)

- Node.js environment with network/database mocking
- Use MSW for HTTP request mocking
- Database tests use in-memory SQLite with Drizzle
- Import test extension: `import { test } from '@/mocks/test-extend-server'`

**Database Tests**

```ts
import { test, initDb } from '@/mocks/test-extend-server'
import { describe, expect } from 'vitest'
import { shows } from './__fixtures__/shows'
import { show } from '@/db/tables'

describe('search tests', () => {
	// Seed database with test data from fixtures
	initDb(async (db) => {
		await db.insert(show).values(shows)
	})

	test('exact title', async ({ db }) => {
		const results = await fetchSuggestions(db, 'Game of Thrones')
		expect(results[0]).toEqual({
			title: 'Game of Thrones',
			imdbId: 'tt0944947',
			rating: 9.2,
		})
	})
})
```

Example with MSW (mock external HTTP requests):

**MSW Mocking Setup**:
For global

```json
// __mocks__/data/suggestions.json
[
	{
		"imdbId": "tt0417299",
		"title": "Avatar: The Last Airbender",
		"startYear": "2005",
		"endYear": "2008",
		"rating": 9.3,
		"numVotes": 410746
	},
	{
		"imdbId": "tt9018736",
		"title": "Avatar: The Last Airbender",
		"startYear": "2024",
		"endYear": null,
		"rating": 7.2,
		"numVotes": 80299
	},
	{
		"imdbId": "tt10732794",
		"title": "The King's Avatar",
		"startYear": "2019",
		"endYear": "2019",
		"rating": 8.1,
		"numVotes": 1776
	},
	{
		"imdbId": "tt6859260",
		"title": "The King's Avatar",
		"startYear": "2017",
		"endYear": null,
		"rating": 7.4,
		"numVotes": 1617
	},
	{
		"imdbId": "tt15776622",
		"title": "Avataro Sentai Donbrothers",
		"startYear": "2022",
		"endYear": "2023",
		"rating": 8.1,
		"numVotes": 345
	}
]
```

```ts
// __mocks__/handlers.ts
import suggestions from '@/mocks/data/suggestions.json' with { type: 'json' }
import { http, HttpResponse } from 'msw'

export default [
	http.get('/api/suggestions', () => {
		return HttpResponse.json(suggestions)
	}),
]
```

```ts
import { test } from '@/mocks/test-extend-server'
import { describe, expect } from 'vitest'
import { fetchGitHubRepos } from './github-repos'

describe('GitHub Repositories', () => {
	test('fetches repositories from GitHub API', async () => {
		const repos = await fetchGitHubRepos('test_token')
		expect(repos).toHaveLength(3)
		expect(repos[0].name).toBe('test-repo')
	})
})
```

**Fixture Data**: Create reusable test data in `__fixtures__/` directories:

```ts
// __fixtures__/seed-data.ts
import type { NewUser } from '@/db/schema'

export const testUsers: NewUser[] = [
	{ id: 'user-1', email: 'alice@example.com', name: 'Alice' },
	{ id: 'user-2', email: 'bob@example.com', name: 'Bob' },
]
```

### Browser Tests (`*.test.tsx`)

- vitest-browser with real Playwright browser
- Test React components in isolation
- Import test extension: `import { test } from '@/mocks/test-extend-browser'`
- Use `vitest-browser-react` for component rendering
- Use `userEvent` from `vitest/browser` for interactions
- Use `expect.element()` for async assertions

Example:

```ts
import { test } from '@/mocks/test-extend-browser'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { ContactCard } from '@/components/contact-me'

describe('ContactCard', () => {
	test('render card', async () => {
		const screen = await render(<ContactCard />)
		expect(screen.getByText('Reach out!')).toBeInTheDocument()
	})

	test('shows error on invalid email', async () => {
		const screen = await render(<ContactCard />)
		const submitButton = screen.getByRole('button', { name: /send message/i })
		await userEvent.click(submitButton)
		expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument()
	})

	test('mocks API responses', async ({ worker }) => {
		worker.use(
			http.get('/api/contact', () => {
				return HttpResponse.json({ success: true })
			}),
		)
		const screen = await render(<ContactCard />)
		// Test interaction...
	})
})
```

**Component Interaction Pattern**:

```ts
test('user can submit form', async () => {
	const screen = await render(<ContactCard />)
	const emailInput = screen.getByLabelText('Email')
	await userEvent.fill(emailInput, 'test@example.com')
	const submitButton = screen.getByRole('button', { name: /send message/i })
	await userEvent.click(submitButton)
	await expect.element(screen.getByText(/message sent/i)).toBeVisible()
})
```

## E2E Tests (Playwright)

- Full browser automation tests
- Located in `e2e/` directory
- Test user flows and page interactions
- Use screenshots for visual regression testing

Example:

```ts
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' })
})

test('search bar click navigation works', async ({ page }) => {
	const searchBar = page.getByRole('combobox')
	await searchBar.click()
	await searchBar.fill('Avatar')
	await page.getByTestId('loading-spinner').waitFor({ state: 'hidden' })
	const avatarDropdownOption = page.getByText('Avatar: The Last Airbender')
	await expect(avatarDropdownOption).toBeVisible()
	await avatarDropdownOption.click()
	await expect(page).toHaveURL(/.*\/ratings\/tt0417299/)
})

test('Screenshot Homepage', async ({ page }) => {
	await expect(page).toHaveScreenshot()
})
```

## Additional Patterns

### Inline Snapshots

Use `toMatchInlineSnapshot()` for complex data structures:

```ts
test('returns correct data structure', () => {
	const results = fetchAllData()
	expect(results).toMatchInlineSnapshot(`
		[
		  {
		    "id": "1",
		    "name": "Alice",
		  },
		  {
		    "id": "2",
		    "name": "Bob",
		  },
		]
	`)
})
```

### Error Testing

```ts
test('throws error with invalid input', async () => {
	await expect(validateEmail('invalid')).rejects.toThrow('Invalid email format')
})
```

### Async Testing

```ts
test('async function returns correct result', async () => {
	const result = await fetchData()
	expect(result).toBeDefined()
})
```

### MSW Mocking

Create JSON files in `__mocks__/data/` for mock responses, then define HTTP
handlers in `__mocks__/handlers.ts`:

```ts
import githubAccessToken from '@/mocks/data/github-access-token.json' with { type: 'json' }
import suggestions from '@/mocks/data/suggestions.json' with { type: 'json' }
import { http, HttpResponse } from 'msw'

export default [
	http.get('/api/suggestions', () => {
		return HttpResponse.json(suggestions)
	}),

	http.post('https://github.com/login/oauth/access_token', async () => {
		return HttpResponse.json(githubAccessToken)
	}),
]
```

**Note**: Use the `with { type: 'json' }` import syntax for JSON mock files.

### Database Testing

Use `initDb()` to seed test data:

```ts
describe('users table', () => {
	initDb(async (db) => {
		await db.insert(users).values(testUsers)
		await db.insert(teams).values(testTeams)
	})

	test('can query users by email', async ({ db }) => {
		const result = await db.query.users.findFirst({
			where: eq(users.email, 'alice@example.com'),
		})
		expect(result?.name).toBe('Alice Developer')
	})
})
```
