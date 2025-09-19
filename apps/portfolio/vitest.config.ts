import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig({
	browser: {
		setupFiles: ['./__mocks__/astro-actions.ts']
	}
})
