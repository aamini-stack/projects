import { test } from 'vitest'
import { Route as HomeRoute } from '@/routes/index'
import { expectPageScreenshot } from './__mocks__/visual-page'

const HomeComponent = HomeRoute.options.component as React.ComponentType

test('landing page matches desktop screenshot', async () => {
	await expectPageScreenshot({
		name: 'landing-desktop',
		path: '/',
		component: HomeComponent,
		waitFor: (screen) => screen.getByRole('heading', { name: /at paw paw's/i }),
		viewport: { width: 1280, height: 720 },
	})
})

test('landing page matches mobile screenshot', async () => {
	await expectPageScreenshot({
		name: 'landing-mobile',
		path: '/',
		component: HomeComponent,
		waitFor: (screen) => screen.getByRole('heading', { name: /at paw paw's/i }),
		viewport: { width: 375, height: 667 },
	})
})
