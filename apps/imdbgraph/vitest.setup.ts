import '@testing-library/jest-dom/vitest'
import { ActionError } from 'astro:actions'
import { vi } from 'vitest'

vi.mock('astro:actions', () => ({
	actions: {
		fetchSuggestions: ({ query }: { query: string }) => {
			if (query === 'error') {
				return Promise.resolve({
					error: new ActionError({
						code: 'INTERNAL_SERVER_ERROR',
					}),
				})
			} else {
				return Promise.resolve({
					data: searchMocks[query.toLocaleLowerCase()] ?? [],
				})
			}
		},
	},
}))

vi.mock(import('@/lib/query'), () => ({
	queryClient: new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	}),
}))
