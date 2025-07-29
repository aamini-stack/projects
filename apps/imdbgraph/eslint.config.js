import nextJsConfig from '@aamini/config-eslint/next';
import pluginTanstack from '@tanstack/eslint-plugin-query';
import { defineConfig } from 'eslint/config';

/** @type {import('eslint').Linter.Config} */
export default defineConfig([
  ...nextJsConfig,
  ...pluginTanstack.configs['flat/recommended'],
  {
    // Override rules here...
    rules: {},
  },
]);
