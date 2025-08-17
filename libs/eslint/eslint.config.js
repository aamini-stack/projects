// @ts-check

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import json from '@eslint/json'
import markdown from '@eslint/markdown'
import css from '@eslint/css'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import astro from 'eslint-plugin-astro'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPrettier from 'eslint-config-prettier'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginTurbo from 'eslint-plugin-turbo'
import { defineConfig, globalIgnores } from 'eslint/config'

export default tseslint.config([
	globalIgnores(['.astro', 'dist', '.vercel']),
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		plugins: { js },
		extends: [js.configs.recommended],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.serviceworker,
			},
		},
	},
	{
		files: ['**/*.json'],
		plugins: { json },
		language: 'json/json',
		extends: [json.configs.recommended],
	},
	{
		files: ['**/*.jsonc'],
		plugins: { json },
		language: 'json/jsonc',
		extends: [json.configs.recommended],
	},
	{
		files: ['**/*.json5'],
		plugins: { json },
		language: 'json/json5',
		extends: [json.configs.recommended],
	},
	{
		files: ['**/*.md'],
		plugins: { markdown },
		language: 'markdown/commonmark',
		extends: [markdown.configs.recommended],
	},
	{
		files: ['**/*.css'],
		plugins: { css },
		language: 'css/css',
		extends: [css.configs.recommended],
	},

	// Typescript
	{
		files: ['**/*.{ts,tsx,mts,mtsx}'],
		extends: [
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unnecessary-condition': [
				'error',
				{
					allowConstantLoopConditions: 'only-allowed-literals',
				},
			],
		},
	},
	{
		files: ['**/*.{js,jsx}'],
		extends: [tseslint.configs.disableTypeChecked],
	},

	// React
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		extends: [
			react.configs.flat.recommended,
			react.configs.flat['jsx-runtime'],
			reactHooks.configs['recommended-latest'],
			jsxA11y.flatConfigs.recommended,
		],
		settings: {
			react: {
				version: 'detect',
			},
		},
	},

	// Astro
	{
		files: ['**/*.astro'],
		extends: [astro.configs.recommended],
	},

	// Astro
	// {
	// 	files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
	// 	...react.configs.flat,
	// },
	// {
	// 	files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
	// 	languageOptions: {
	// 		globals: {
	// 			...globals.serviceworker,
	// 			...globals.browser,
	// 		},
	// 	},
	// },
	// {
	// 	files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
	// 	extends: [
	// 		react.configs.flat,
	// 		jsxA11y.flatConfigs.strict,
	// 		reactHooks.configs['recommended-latest'],
	// 		astro.configs['flat/recommended'],
	// 		astro.configs['flat/jsx-a11y-strict'],
	// 	],
	// 	// ...pluginReact.configs.flat['jsx-runtime'],
	// 	// // ...eslintPluginJsxA11y.flatConfigs.recommended,
	// 	// ...pluginReactHooks.configs['recommended-latest'],
	// 	languageOptions: {
	// 		...react.configs.flat,
	// 		...jsxA11y.flatConfigs.strict.languageOptions,
	// 		globals: {
	// 			...globals.serviceworker,
	// 			...globals.browser,
	// 		},
	// 	},
	// },

	// TurboRepo
	{
		plugins: {
			turbo: pluginTurbo,
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn',
		},
	},

	// Tests (Playwright + Vitest)
	{
		files: ['**/*e2e.{spec,test}.ts'],
		...pluginPlaywright.configs['flat/recommended'],
	},
	{
		files: ['**/*.test.*', '**/__tests__/**'],
		...pluginVitest.configs.recommended,
	},

	// Prevent Relative Imports like:
	// import { x } from '../folder/module-a';
	{
		files: ['src/**/*.{ts,tsx,js,mjs,cjs,jsx}'],
		ignores: ['**/*.test.*', '**/__tests__/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '^\\.\\.?/(?!globals\\.css$)',
							message:
								"Please use absolute imports with '@/'. Example: '@/lib/utils'. Exception: './globals.css' is allowed.",
						},
					],
				},
			],
		},
	},
	pluginPrettier,
])
