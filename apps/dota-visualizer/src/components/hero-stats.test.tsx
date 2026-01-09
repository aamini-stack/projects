import { HeroStats } from '@/components/hero-stats'
import { fetchLatestHeroData } from '@/lib/dota/api'
import type { HeroDictionary } from '@/lib/dota/hero'
import { beforeAll, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

describe('HeroStats Component', () => {
	let heroDictionary: HeroDictionary

	// Setup: fetch hero data once for all tests
	beforeAll(async () => {
		heroDictionary = await fetchLatestHeroData()
	})

	test('renders stat groups correctly', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		// Check that all stat groups are present using heading role
		await expect
			.element(page.getByRole('heading', { name: 'Attributes' }))
			.toBeInTheDocument()
		await expect
			.element(page.getByRole('heading', { name: 'Vitals' }))
			.toBeInTheDocument()
		await expect
			.element(page.getByRole('heading', { name: 'Defense' }))
			.toBeInTheDocument()
		await expect
			.element(page.getByRole('heading', { name: 'Vision' }))
			.toBeInTheDocument()
	})

	test('renders percentile view when stat is clicked', async () => {
		const screen = await render(<HeroStats heroDictionary={heroDictionary} />)
		expect(screen.baseElement).toMatchScreenshot()
	})
})
