import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { FeatureCard } from './feature-card'

test('render card', async () => {
	const screen = await render(<FeatureCard />)
	expect(screen.getByText("What's New in Astro 5.0?")).toBeVisible()
	expect(screen.getByText('New', { exact: true })).toBeVisible()
	expect(
		screen.getByText(/From content layers to server islands/),
	).toBeVisible()
	expect(screen.getByRole('link', { name: /Learn more/ })).toBeVisible()
})

test('link', async () => {
	const screen = await render(<FeatureCard />)
	expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
		'href',
		'https://astro.build/blog/astro-5/',
	)
})
