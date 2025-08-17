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
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginTurbo from 'eslint-plugin-turbo'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
	globalIgnores(['.astro', 'dist', '.vercel']),
	{
		name: 'JavaScript',
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		extends: [js.configs.recommended],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.serviceworker,
			},
		},
	},
	// {
	// 	files: ['**/*.json'],
	// 	plugins: { json },
	// 	language: 'json/json',
	// 	extends: [json.configs.recommended],
	// },
	// {
	// 	files: ['**/*.jsonc'],
	// 	plugins: { json },
	// 	language: 'json/jsonc',
	// 	extends: [json.configs.recommended],
	// },
	// {
	// 	files: ['**/*.json5'],
	// 	plugins: { json },
	// 	language: 'json/json5',
	// 	extends: [json.configs.recommended],
	// },
	// {
	// 	files: ['**/*.md'],
	// 	plugins: { markdown },
	// 	language: 'markdown/commonmark',
	// 	extends: [markdown.configs.recommended],
	// },
	// {
	// 	files: ['**/*.css'],
	// 	plugins: { css },
	// 	language: 'css/css',
	// 	extends: [css.configs.recommended],
	// },

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
			'@typescript-eslint/no-confusing-void-expression': 'off',
		},
	},

	// React
	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		settings: {
			react: {
				version: 'detect',
			},
		},
	},

	{
		files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
		extends: [
			react.configs.flat.recommended,
			react.configs.flat['jsx-runtime'],
			reactHooks.configs['recommended-latest'],
			jsxA11y.flatConfigs.recommended,
		],
	},

	...astro.configs.recommended,

	// TurboRepo
	{
		name: 'Turborepo',
		plugins: {
			turbo: pluginTurbo,
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn',
		},
	},

	// Tests (Playwright + Vitest)
	{
		name: 'Playwright',
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
		name: 'imports',
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
])
