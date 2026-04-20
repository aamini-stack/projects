import {
	createRootRoute,
	createRoute,
	createRouter,
	RouterContextProvider,
} from '@tanstack/react-router'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { QuestionFlow } from './question-flow'

function createMockRouter() {
	const rootRoute = createRootRoute()
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/',
	})

	return createRouter({
		routeTree: rootRoute.addChildren([indexRoute]),
	})
}

function MockRouter({ children }: { children: React.ReactNode }) {
	return (
		<RouterContextProvider router={createMockRouter()}>
			{children}
		</RouterContextProvider>
	)
}

test('question flow gates progress and completes on final answer', async () => {
	const screen = await render(
		<QuestionFlow
			backTo="/"
			backLabel="Back"
			stepLabel="Step 2 of 4"
			accentClassName="bg-primary"
			accentTextClassName="text-primary"
			accentTintClassName="bg-primary/10"
			accentHoverBorderClassName="hover:border-primary/30"
			completeTo="/done"
			completeLabel="View Matches"
			questions={[
				{
					id: 'q1',
					number: 1,
					category: 'Working Style',
					prompt: 'How fast should your agent reply?',
					options: ['Same day', 'Within 24 hours'],
				},
				{
					id: 'q2',
					number: 2,
					category: 'Fit',
					prompt: 'Anything else to share?',
					inputType: 'open-text',
				},
			]}
		/>,
		{ wrapper: MockRouter },
	)

	const nextButton = screen.getByRole('button', { name: /next question/i })
	await expect.element(nextButton).toBeDisabled()

	await userEvent.click(screen.getByRole('button', { name: /same day/i }))
	await expect.element(nextButton).toBeEnabled()

	await userEvent.click(nextButton)
	await expect.element(page.getByText('Question 2 of 2')).toBeVisible()
	await expect
		.element(screen.getByPlaceholder(/share a few details/i))
		.toBeVisible()

	await userEvent.fill(
		screen.getByPlaceholder(/share a few details/i),
		'Need calm guidance.',
	)
	await expect
		.element(screen.getByRole('link', { name: /view matches/i }))
		.toBeVisible()
	await expect
		.element(screen.getByRole('button', { name: /previous/i }))
		.toBeEnabled()
	await expect.element(screen.getByText('100%')).toBeVisible()
})

test('question flow supports multi-select before completion', async () => {
	const screen = await render(
		<QuestionFlow
			backTo="/"
			backLabel="Back"
			stepLabel="Step 2 of 4"
			accentClassName="bg-primary"
			accentTextClassName="text-primary"
			accentTintClassName="bg-primary/10"
			accentHoverBorderClassName="hover:border-primary/30"
			completeTo="/done"
			completeLabel="Finish"
			questions={[
				{
					id: 'q1',
					number: 1,
					categories: ['Communication', 'Transparency'],
					prompt: 'Pick two priorities',
					options: ['Clarity', 'Speed', 'Proactive updates'],
					selection: {
						type: 'multiple',
						maxSelections: 2,
					},
				},
			]}
		/>,
		{ wrapper: MockRouter },
	)

	await expect
		.element(screen.getByRole('button', { name: /finish/i }))
		.not.toBeInTheDocument()
	await userEvent.click(screen.getByRole('button', { name: /clarity/i }))
	await expect
		.element(screen.getByRole('link', { name: /finish/i }))
		.toBeVisible()
	await userEvent.click(screen.getByRole('button', { name: /speed/i }))
	await expect.element(screen.getByText('100%')).toBeVisible()
	await expect
		.element(screen.getByRole('link', { name: /finish/i }))
		.toBeVisible()
})
