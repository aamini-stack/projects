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
	waitFor: (screen: RenderResult) => Locator
	fullPage?: boolean
}

const pages = [
	{
		name: 'homepage',
		component: Home,
		waitFor: (screen) => screen.getByText(/your neighborhood team/i),
		fullPage: false,
	},
	{
		name: 'homepage-full',
		component: Home,
		waitFor: (screen) => screen.getByText(/your neighborhood team/i),
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
