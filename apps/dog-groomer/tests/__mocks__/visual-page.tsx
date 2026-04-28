import {
	createRootRoute,
	createRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router'
import { expectComponentScreenshot } from '@aamini/config-testing/test/visual-page'
import type { ComponentType, ReactNode } from 'react'
import type { Locator } from 'vitest/browser'
import type { RenderResult } from 'vitest-browser-react'

function createMockRouter(path: string, component: ComponentType) {
	const rootRoute = createRootRoute()
	const testRoute = createRoute({
		getParentRoute: () => rootRoute,
		path,
		component: () => {
			const Component = component
			return <Component />
		},
	})

	return createRouter({
		routeTree: rootRoute.addChildren([testRoute]),
	})
}

function createWrapper(path: string, component: ComponentType) {
	return function MockRouter({ children }: { children: ReactNode }) {
		return (
			<RouterContextProvider router={createMockRouter(path, component)}>
				{children}
			</RouterContextProvider>
		)
	}
}

export async function expectPageScreenshot({
	component,
	path,
	name,
	waitFor,
	viewport,
}: {
	component: ComponentType
	path: string
	name: string
	waitFor: (screen: RenderResult) => Locator
	viewport?: { width: number; height: number }
}) {
	await expectComponentScreenshot({
		component,
		name,
		waitFor,
		wrapper: createWrapper(path, component),
		viewport,
	})
}
