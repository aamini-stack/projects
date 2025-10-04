import { page } from '@vitest/browser/context'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Page from './+page.svelte'

describe('/+page.svelte', () => {
	test('should render title', async () => {
		render(Page)

		const heading = page.getByRole('heading', {
			level: 1,
			name: 'Welcome to IMDB Graph',
		})
		await expect.element(heading).toBeInTheDocument()
	})
})
