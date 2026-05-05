import {
	createRootRoute,
	createRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expectComponentScreenshot } from '@aamini/config-testing/test/visual-page'
import type { ComponentType, ReactNode } from 'react'
import type { Locator } from 'vitest/browser'
import { expect } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'

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
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	})

	return function MockRouter({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<RouterContextProvider router={createMockRouter(path, component)}>
					{children}
				</RouterContextProvider>
			</QueryClientProvider>
		)
	}
}

export async function expectPageScreenshot({
	component,
	path,
	name,
	waitFor,
	setup,
	visual = true,
}: {
	component: ComponentType
	path: string
	name: string
	waitFor: (screen: RenderResult) => Locator
	setup?: () => void
	visual?: boolean
}) {
	if (!visual) {
		setup?.()
		const Component = component
		const screen = await render(<Component />, {
			wrapper: createWrapper(path, component),
		})
		await expect.element(waitFor(screen)).toBeVisible()
		return
	}

	await expectComponentScreenshot({
		component,
		name,
		waitFor,
		setup,
		wrapper: createWrapper(path, component),
	})
}
