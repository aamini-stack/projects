import js from '@eslint/js';
import pluginVitest from '@vitest/eslint-plugin';
import pluginPrettier from 'eslint-config-prettier';
import pluginPlaywright from 'eslint-plugin-playWright';
import pluginTurbo from 'eslint-plugin-turbo';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export default defineConfig([
  globalIgnores(['node_modules', '.next', 'dist/**']),
  js.configs.recommended,
  pluginPrettier,

  // TypeScript
  {
    files: ['**/*.{ts,tsx}'],
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
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

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
  pluginPlaywright.configs['flat/recommended'],
  {
    files: ['**/*.test.*', '**/__tests__/**'],
    ...pluginVitest.configs.recommended,
  },

  // Prevent Relative Imports like:
  // import { x } from '../folder/module-a';
  {
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
]);
