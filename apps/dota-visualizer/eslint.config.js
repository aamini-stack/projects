import nextJsConfig from '@aamini/config-eslint/next';
import { defineConfig } from 'eslint/config';

/** @type {import('eslint').Linter.Config} */
export default defineConfig([
  ...nextJsConfig,
  {
    // Override rules here...
    rules: {
      '@typescript-eslint/array-type': 'off',
    },
  },
]);
