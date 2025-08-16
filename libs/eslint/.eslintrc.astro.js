import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginAstro from 'eslint-plugin-astro'
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import baseConfig from './.eslintrc.base.js'

/**
 * A custom shared ESLint configuration for applications that use Next.js.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default defineConfig([
	globalIgnores(['.astro', 'dist', '.vercel']),
	...baseConfig,
	pluginReact.configs.flat.recommended,
	pluginReactHooks.configs.recommended,
	...eslintPluginAstro.configs.recommended,
	eslintPluginJsxA11y.configs['jsx-a11y-strict'],
])
