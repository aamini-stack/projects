import baseConfig from './.eslintrc.base.js';
import pluginNext from '@next/eslint-plugin-next';
import pluginJest from 'eslint-plugin-jest';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

/**
 * A custom shared ESLint configuration for applications that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export default defineConfig([
  ...baseConfig,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Jest
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { jest: pluginJest },
  },
]);
