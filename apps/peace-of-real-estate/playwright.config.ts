import { baseConfig } from '@aamini/config-testing/playwright'

const config = baseConfig({ port: 4102 })

config.globalSetup = './e2e/global-setup.ts'

export default config
