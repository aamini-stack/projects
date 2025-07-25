import baseConfig from '@aamini/config-eslint/base';
import { defineConfig } from 'eslint/config';

/**
 * A shared ESLint configuration for playwright packages.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default defineConfig([...baseConfig]);
