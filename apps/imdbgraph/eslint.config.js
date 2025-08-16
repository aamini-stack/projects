import astroConfig from '@aamini/config-eslint/astro'
import pluginTanstack from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'

/** @type {import('eslint').Linter.Config} */
export default defineConfig([
	...astroConfig,
	...pluginTanstack.configs['flat/recommended'],
	{
		// Override rules here...
		rules: {},
	},
])
