import { baseConfig } from '@aamini/config-testing/playwright'
import { ensurePostgresContainer } from '@aamini/config-testing/test/postgres'

const { databaseUrl } = await ensurePostgresContainer()

process.env.DATABASE_URL = databaseUrl

const config = baseConfig({ port: 4002 })

config.globalSetup = './e2e/global-setup.ts'

export default config
