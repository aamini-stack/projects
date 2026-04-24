import { vi } from 'vitest'

vi.mock('@/lib/auth-client', () => ({
	authClient: {
		useSession: () => ({ data: null, isPending: false }),
		signIn: {
			email: vi.fn(),
			social: vi.fn(),
		},
		signUp: {
			email: vi.fn(),
		},
		signOut: vi.fn(),
	},
}))
