import {
	createRootRoute,
	createRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ComponentType, ReactNode } from 'react'
import { expect } from 'vitest'
import { page, type Locator } from 'vitest/browser'
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
}: {
	component: ComponentType
	path: string
	name: string
	waitFor: (screen: RenderResult) => Locator
	setup?: () => void
}) {
	localStorage.clear()
	setup?.()
	await page.viewport(1280, 720)
	expect(window.innerWidth).toBe(1280)

	const container = document.body.appendChild(document.createElement('div'))
	container.style.width = '100vw'
	container.style.minHeight = '100vh'
	const Component = component

	const screen = await render(<Component />, {
		container,
		wrapper: createWrapper(path, component),
	})

	await expect.element(waitFor(screen)).toBeVisible()
	await document.fonts.ready
	await page.viewport(1280, Math.ceil(container.scrollHeight))
	await expect.element(screen.locator).toMatchScreenshot(`${name}.png`, {
		screenshotOptions: { scale: 'css' },
	})
}
