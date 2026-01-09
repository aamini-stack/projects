import { baseConfig } from '@aamini/config-testing/playwright'

const config = baseConfig({ port: 4032 })
if (config.projects) {
	config.projects = config.projects.filter((p) => p.name !== 'mobile')
}

export default config
