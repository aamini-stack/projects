import nextJsConfig from '@aamini/config-eslint/next';

/** @type {import('eslint').Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      '@typescript-eslint/array-type': 'off',
    },
  },
];
