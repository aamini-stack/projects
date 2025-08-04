import astroConfig from '@aamini/config-eslint/astro';
import { defineConfig } from 'eslint/config';

/** @type {import('eslint').Linter.Config} */
export default defineConfig([...astroConfig]);
