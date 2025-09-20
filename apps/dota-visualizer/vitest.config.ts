import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig({
	unit: {
		setupFiles: ['./__mocks__/setup-http.ts'],
	},
})
