import baseConfig from './.eslintrc.base.js';
import playwright from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';

/**
 * A shared ESLint configuration for playwright packages.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default defineConfig([
  ...baseConfig,
  playwright.configs['flat/recommended'],
]);
