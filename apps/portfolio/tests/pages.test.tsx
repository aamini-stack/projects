import { expectComponentScreenshot } from '@aamini/config-testing/test/visual-page'
import type { ComponentType } from 'react'
import type { Locator } from 'vitest/browser'
import { afterEach, test } from 'vitest'
import { cleanup } from 'vitest-browser-react'
import type { RenderResult } from 'vitest-browser-react'

import { Route as HomeRoute } from '@/routes/index'

const Home = HomeRoute.options.component as ComponentType

interface VisualPage {
	name: string
	component: ComponentType
	prepare?: (screen: RenderResult) => void | Promise<void>
	waitFor: (screen: RenderResult) => Locator
	target?: (screen: RenderResult) => Locator
	fullPage?: boolean
}

const pages = [
	{
		name: 'home-intro',
		component: Home,
		waitFor: (screen) => screen.getByRole('heading', { name: /aria amini/i }),
	},
	{
		name: 'home-experience',
		component: Home,
		prepare: async (screen) => {
			await screen.getByRole('link', { name: /about me/i }).click()
		},
		waitFor: (screen) => screen.getByTitle('Experience'),
	},
	{
		name: 'home-full-page',
		component: Home,
		waitFor: (screen) => screen.getByTestId('contact-card'),
	},
	{
		name: 'contact-card-basic',
		component: Home,
		prepare: (screen) => {
			screen.getByTestId('contact-card').element().scrollIntoView()
		},
		waitFor: (screen) => screen.getByTestId('contact-card'),
		target: (screen) => screen.getByTestId('contact-card'),
		fullPage: false,
	},
	{
		name: 'contact-card-error-state',
		component: Home,
		prepare: async (screen) => {
			const contactCard = screen.getByTestId('contact-card')
			contactCard.element().scrollIntoView()
			await screen.getByRole('button', { name: /send message/i }).click()
		},
		waitFor: (screen) => screen.getByText('Invalid email address'),
		target: (screen) => screen.getByTestId('contact-card'),
		fullPage: false,
	},
] satisfies VisualPage[]

const viewports = [
	{ name: 'desktop', width: 1280, height: 720 },
	{ name: 'mobile', width: 390, height: 844 },
] as const

afterEach(async () => {
	await cleanup()
	document.body.replaceChildren()
})

test.each(pages)('$name page matches screenshots', async (visualPage) => {
	for (const viewport of viewports) {
		await expectComponentScreenshot({
			...visualPage,
			name: `${visualPage.name}-${viewport.name}`,
			viewport,
		})
	}
})
