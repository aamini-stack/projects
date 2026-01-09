import { createBaseConfig } from '@aamini/config-testing/vitest'

export default createBaseConfig({
	unit: {
		test: {
			setupFiles: ['./__mocks__/setup-http.ts'],
		},
	},
})
