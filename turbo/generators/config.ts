import { PlopTypes } from '@turbo/gen';

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
      // Copy files
      {
        type: 'addMany',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}',
        templateFiles: '../templates/sample-app/*',
        base: '../templates/sample-app',
        force: true,
        globOptions: {
          dot: true,
          ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
        },
      },
      {
        type: 'addMany',
        destination: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e',
        templateFiles: '../templates/sample-app-e2e/*',
        base: '../templates/sample-app-e2e',
        force: true,
        globOptions: {
          dot: true,
          ignore: ['**/node_modules/**'],
        },
      },
      // Fix App package.json
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}/package.json',
        pattern: /"name": "@aamini\/sample-app"/,
        template: '"name": "@aamini/{{ appName }}"',
      },
      // Fix E2E package.json
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
      // Fix Playwright config
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: /baseURL: 'http:\/\/localhost:3000'/,
        template: "baseURL: 'http://localhost:{{ port }}'",
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: /url: 'http:\/\/localhost:3000'/,
        template: "url: 'http://localhost:{{ port }}'",
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: /command: 'pnpm run start -p 3000'/,
        template: "command: 'pnpm run start -p {{ port }}'",
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/apps/{{ appName }}-e2e/playwright.config.ts',
        pattern: /cwd: '\.\.\/sample-app'/,
        template: "cwd: '../{{ appName }}'",
      },
    ],
  });
}
