import base from '@aamini/config-eslint/base'
import pluginTanstack from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'

/** @type {import('eslint').Linter.Config} */
export default defineConfig([
	...base,
	...pluginTanstack.configs['flat/recommended'],
	{
		// Override rules here...
		rules: {},
	},
])
