import { createElement, type ComponentType, type ReactNode } from 'react'
import { expect } from 'vitest'
import { page, type Locator } from 'vitest/browser'
import { render, type RenderResult } from 'vitest-browser-react'

interface Viewport {
	width: number
	height: number
}

interface ExpectComponentScreenshotOptions {
	component: ComponentType
	name: string
	waitFor: (screen: RenderResult) => Locator
	prepare?: ((screen: RenderResult) => void | Promise<void>) | undefined
	target?: ((screen: RenderResult) => Locator) | undefined
	setup?: (() => void | Promise<void>) | undefined
	wrapper?: ComponentType<{ children: ReactNode }> | undefined
	viewport?: Viewport | undefined
	fullPage?: boolean | undefined
}

export async function expectComponentScreenshot({
	component,
	name,
	waitFor,
	prepare,
	target = (screen) => screen.locator,
	setup,
	wrapper,
	viewport = { width: 1280, height: 720 },
	fullPage = true,
}: ExpectComponentScreenshotOptions) {
	localStorage.clear()
	document.body.replaceChildren()
	await setup?.()
	await page.viewport(viewport.width, viewport.height)

	const container = document.body.appendChild(document.createElement('div'))
	container.style.width = '100vw'
	container.style.minHeight = '100vh'

	const screen = await render(
		createElement(component),
		wrapper ? { container, wrapper } : { container },
	)

	await prepare?.(screen)
	await expect.element(waitFor(screen)).toBeVisible()
	await document.fonts.ready
	if (fullPage) {
		await page.viewport(viewport.width, Math.ceil(container.scrollHeight))
	}
	await expect.element(target(screen)).toMatchScreenshot(`${name}.png`, {
		screenshotOptions: { scale: 'css' },
	})
}
