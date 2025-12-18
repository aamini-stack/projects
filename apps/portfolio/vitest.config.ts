import { createBaseConfig } from '@aamini/config-testing/vitest'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, createBaseConfig({}))
