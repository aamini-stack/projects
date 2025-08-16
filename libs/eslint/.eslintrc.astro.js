// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config'
import eslintPluginAstro from 'eslint-plugin-astro'
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import baseConfig from './.eslintrc.base.js'
import globals from 'globals'

/**
 * A custom shared ESLint configuration for applications that use Next.js.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default defineConfig([
	globalIgnores(['.astro', 'dist', '.vercel']),
	...baseConfig,
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		// ...pluginReact.configs.flat.recommended,
		// ...pluginReact.configs.flat['jsx-runtime'],
		// // ...eslintPluginJsxA11y.flatConfigs.recommended,
		// ...pluginReactHooks.configs['recommended-latest'],
		settings: { react: { version: 'detect' } },
		languageOptions: {
			...pluginReact.configs.flat.recommended.languageOptions,
			// ...eslintPluginJsxA11y.flatConfigs.recommended.languageOptions,
			globals: {
				...globals.serviceworker,
				...globals.browser,
			},
		},
	},
	...eslintPluginAstro.configs['flat/recommended'],
	...eslintPluginAstro.configs['flat/jsx-a11y-strict'],
	// {
	// 	files: ['**/*.astro'],
	// 	plugins: {
	// 		'jsx-a11y': eslintPluginJsxA11y.configs.strict.plugins,
	// 	},
	// 	languageOptions: {
	// 		parserOptions: {
	// 			ecmaFeatures: {
	// 				jsx: true,
	// 			},
	// 		},
	// 	},
	// 	rules: {
	// 		// ... any rules you want
	// 		'jsx-a11y/alt-text': 'error',
	// 	},
	// },
	// ...eslintPluginAstro.configs['flat/recommended'],
	// ...eslintPluginAstro.configs['flat/jsx-a11y-strict'],
])
