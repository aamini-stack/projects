import { baseConfig } from '@aamini/config-testing/playwright'

const config = await baseConfig()
if (config.projects) {
	config.projects = config.projects.filter((p) => p.name !== 'mobile')
}

export default config
