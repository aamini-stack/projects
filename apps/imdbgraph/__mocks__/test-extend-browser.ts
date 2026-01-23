import handlers from '@/mocks/handlers'
import {
	createMswBrowserFixture,
	type MswBrowserFixture,
} from '@aamini/config-testing/fixtures'
import { test as baseTest } from 'vitest'

const mswBrowserFixture = createMswBrowserFixture(handlers)

export const test = baseTest.extend<MswBrowserFixture>({
	...mswBrowserFixture,
})
