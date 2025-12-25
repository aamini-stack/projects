import '@/styles.css'
import { vi } from 'vitest'

vi.mock(import('@/env'), () => ({
	serverEnv: {
		DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
		CRON_SECRET: 'test-secret',
		NODE_ENV: 'test' as const,
	},
	clientEnv: {
		VITE_PUBLIC_POSTHOG_KEY: 'test-key',
	},
}))
