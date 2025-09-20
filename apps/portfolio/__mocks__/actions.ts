import { vi } from 'vitest'

export const actions = {
	sendEmail: vi.fn().mockResolvedValue({ error: null }),
}
