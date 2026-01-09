import { HeroStats } from '@/components/hero-stats'
import { fetchLatestHeroData } from '@/lib/dota/api'
import type { HeroDictionary } from '@/lib/dota/hero'
import { render } from 'vitest-browser-react'
import { beforeAll, describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'

describe('HeroStats Component', () => {
	let heroDictionary: HeroDictionary

	// Setup: fetch hero data once for all tests
	beforeAll(async () => {
		heroDictionary = await fetchLatestHeroData()
	})

	test('renders with default hero (Anti-Mage)', async () => {
		const rendered = await render(<HeroStats heroDictionary={heroDictionary} />)

		// Check that Anti-Mage is rendered using heading role
		const antiMageHeading = await page.getByRole('heading', { name: /Anti-Mage/i })
		await expect.element(antiMageHeading).toBeInTheDocument()

		// Take snapshot of initial state
		expect(rendered.container).toMatchSnapshot()
	})

	test('renders stat groups correctly', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		// Check that all stat groups are present using heading role
		await expect.element(page.getByRole('heading', { name: 'Attributes' })).toBeInTheDocument()
		await expect.element(page.getByRole('heading', { name: 'Vitals' })).toBeInTheDocument()
		await expect.element(page.getByRole('heading', { name: 'Defense' })).toBeInTheDocument()
		await expect.element(page.getByRole('heading', { name: 'Vision' })).toBeInTheDocument()
	})

	test('renders percentile view when stat is clicked', async () => {
		const rendered = await render(<HeroStats heroDictionary={heroDictionary} />)

		// Default stat (baseArmor) should already be selected
		const distributionText = await page.getByText(/Base Armor Distribution/i)
		await expect.element(distributionText).toBeInTheDocument()

		// Take snapshot with percentile visualization
		expect(rendered.container).toMatchSnapshot('with-percentile-view')
	})

	test('percentile view shows hero icons in buckets', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		// Check that the percentile visualization is present
		await expect
			.element(page.getByText(/Base Armor Distribution/i))
			.toBeInTheDocument()

		// Check that hero icons are rendered (they should have alt text with hero names)
		const heroIcons = await page.getByRole('img').all()
		expect(heroIcons.length).toBeGreaterThan(0)

		// Verify first icon has proper alt and src using the element itself
		const firstIconElement = heroIcons[0]?.element()
		const alt = firstIconElement?.getAttribute('alt')
		const src = firstIconElement?.getAttribute('src')
		expect(alt).toBeTruthy()
		expect(src).toBeTruthy()
	})

	test('highlights current hero in percentile view', async () => {
		const rendered = await render(<HeroStats heroDictionary={heroDictionary} />)

		// Find the current hero's text
		await expect
			.element(page.getByText(/Your hero \(Anti-Mage\)/i))
			.toBeInTheDocument()

		// Snapshot should show the highlighted hero
		expect(rendered.container).toMatchSnapshot('with-highlighted-hero')
	})

	test('switches to different stat when clicked', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		// Wait for initial render
		await expect.element(page.getByText('Base Armor:')).toBeInTheDocument()

		// Click on a different stat (Base Strength)
		const baseStrengthStat = page.getByText(/Base Strength:/i)
		await baseStrengthStat.click()

		// Wait for the percentile view to update
		await expect
			.element(page.getByText(/Base Strength Distribution/i))
			.toBeInTheDocument()
	})

	test('displays percentile buckets correctly', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		await expect
			.element(page.getByText(/Base Armor Distribution/i))
			.toBeInTheDocument()

		// Check that the percentile axis label is present
		await expect.element(page.getByText('Percentile', { exact: true })).toBeInTheDocument()

		// Verify that there are multiple percentile bucket elements
		const percentileBuckets = await page.getByText(/\d+th percentile/i).all()
		expect(percentileBuckets.length).toBeGreaterThan(0)
	})

	test('shows stats summary (min, median, max)', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		await expect
			.element(page.getByText(/Base Armor Distribution/i))
			.toBeInTheDocument()

		// Check for stats summary
		await expect.element(page.getByText('Min')).toBeInTheDocument()
		await expect.element(page.getByText('Median')).toBeInTheDocument()
		await expect.element(page.getByText('Max')).toBeInTheDocument()
	})

	test('renders stat cards with percentiles', async () => {
		render(<HeroStats heroDictionary={heroDictionary} />)

		await expect.element(page.getByText(/Base Armor:/i)).toBeInTheDocument()

		// Check that percentile text is rendered for stats
		const percentileTexts = await page.getByText(/percentile/i).all()
		expect(percentileTexts.length).toBeGreaterThan(0)
	})

	test('snapshot: complete component with all features', async () => {
		const rendered = await render(<HeroStats heroDictionary={heroDictionary} />)

		await expect.element(page.getByRole('heading', { name: /Anti-Mage/i })).toBeInTheDocument()
		await expect
			.element(page.getByText(/Base Armor Distribution/i))
			.toBeInTheDocument()

		// Take final comprehensive snapshot
		expect(rendered.container).toMatchSnapshot('complete-component')
	})
})
