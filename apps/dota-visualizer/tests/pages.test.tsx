import { AppHeader } from '@/components/app-header'
import { getView } from '@/components/views/registry'
import { fetchLatestHeroData } from '@/lib/dota/api'
import type { HeroDictionary } from '@/lib/dota/hero'
import { test } from '@aamini/config-testing/test/browser'
import { expectComponentScreenshot } from '@aamini/config-testing/test/visual-page'
import { afterEach } from 'vitest'
import type { Locator } from 'vitest/browser'
import { cleanup } from 'vitest-browser-react'
import type { RenderResult } from 'vitest-browser-react'

let heroDictionary: HeroDictionary

interface VisualPage {
	name: string
	viewId: string
	prepare?: (screen: RenderResult) => void | Promise<void>
	waitFor: (screen: RenderResult) => Locator
}

const pages = [
	{
		name: 'armor-page',
		viewId: 'armor-table',
		waitFor: (screen) => screen.getByRole('table'),
	},
	{
		name: 'xp-gold-page',
		viewId: 'xp-gold',
		prepare: async () => {
			await new Promise((resolve) => setTimeout(resolve, 1200))
		},
		waitFor: (screen) => screen.getByRole('heading', { name: 'Hero Levels' }),
	},
] satisfies VisualPage[]

afterEach(async () => {
	await cleanup()
	document.body.replaceChildren()
})

test.each(pages)(
	'$name page matches desktop screenshot',
	async (visualPage) => {
		await expectComponentScreenshot({
			component: () => <DotaVisualPage viewId={visualPage.viewId} />,
			name: visualPage.name,
			setup: async () => {
				heroDictionary = await fetchLatestHeroData()
			},
			prepare: visualPage.prepare,
			waitFor: visualPage.waitFor,
		})
	},
)

function DotaVisualPage({ viewId }: { viewId: string }) {
	const currentView = getView(viewId)
	const ViewComponent = currentView.component

	return (
		<main className="flex min-h-screen flex-col items-center p-24">
			<AppHeader currentViewId={viewId} onViewChange={() => {}} />
			<ViewComponent heroDictionary={heroDictionary} />
		</main>
	)
}
