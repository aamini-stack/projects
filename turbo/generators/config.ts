import { PlopTypes } from '@turbo/gen';

const options = [
  'addNext',
  'addVitest',
  'addVitestServerMock',
  'addDb',
  'addLint',
  'addCline',
];

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('app', {
    description: 'Creates a new Next.js app from sample-app template',
    prompts: [
      {
        type: 'input',
        name: 'appName',
        message: 'What is the name of the new app to create?',
        validate: (input) => {
          if (!input) {
            return 'App name is required';
          }

          if (/^[a-z]([a-z0-9]|-(?!-))*[a-z0-9]$|^[a-z]$/.test(input)) {
            return true;
          } else {
            return 'App name must be lowercase letters/numbers/dashes only, cannot start/end with dash, no consecutive dashes';
          }
        },
      },
      {
        type: 'input',
        name: 'port',
        message: 'What port should be used for testing?',
        validate: (input) => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Port must be a valid number between 1 and 65535';
          }
          return true;
        },
      },
    ],
    actions: [
      // Basics
      {
        type: 'addMany',
        base: '../templates/sample-app',
        templateFiles: [
          '../templates/sample-app/eslint.config.js',
          '../templates/sample-app/tsconfig.json',
          '../templates/sample-app/package.json',
          '../templates/sample-app/postcss.config.mjs',
          '../templates/sample-app/next.config.ts',
          '../templates/sample-app/components.json',
          '../templates/sample-app/src/app/layout.tsx',
          '../templates/sample-app/src/app/globals.css',
        ],
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}',
        force: true,
      },
      // Playwright
      {
        type: 'addMany',
        base: '../templates/sample-app-e2e',
        templateFiles: [
          '../templates/sample-app-e2e/**/*',
          '!../templates/sample-app-e2e/node_modules/**/*',
          '!../templates/sample-app-e2e/src/**/*',
        ],
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e',
        force: true,
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/package.json',
        pattern: /"name": "@aamini\/sample-app-e2e"/,
        template: '"name": "@aamini/{{ appName }}-e2e"',
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/package.json',
        pattern: /"@aamini\/sample-app": "workspace:\*"/,
        template: '"@aamini/{{ appName }}": "workspace:*"',
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: '5000',
        template: '{{ port }}',
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: '5000',
        template: '{{ port }}',
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: /sample-app/,
        template: '{{ appName }}',
      },
      // Vitest
      {
        type: 'addMany',
        base: '../templates/sample-app',
        templateFiles: '../templates/sample-app/vitest.*.ts',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}',
        force: true,
      },
      {
        type: 'addMany',
        base: '../templates/sample-app/mocks',
        templateFiles: '../templates/sample-app/mocks/**/*',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}/mocks',
        force: true,
      },
      {
        type: 'addMany',
        base: '../templates/sample-app/src/lib',
        templateFiles: '../templates/sample-app/src/lib/**/*',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}/src/lib',
        force: true,
      },
      // Cline
      {
        type: 'addMany',
        base: '../templates/sample-app',
        templateFiles: '../templates/sample-app/.clinerules**/*',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}/.clinerules',
        force: true,
      },
    ],
  });
}
