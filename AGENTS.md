# @aamini-stack Monorepo

This is a monorepo for tanstack webapps. The project uses pnpm workspaces for
package management and turborepo for efficient building/task management. Each
app is located in /apps and has its own accompanying documentation.

Shared packages are located in /packages and include:

- Common configs for vite, vitest, playwright, and typescript.
- Different themes of shadcn components (ex: @aamini/ui and
  @aamini/ui-neobrutalist).
- Pulumi code for provisioning any required infra (datbases, vms, clusters, etc)

## Commands

cd into the right /apps directory and run these commands. Running commands
from root will use turbo to run that command for each subproject. (Ex: Running 'pnpm build' from root will launch 5 concurrent build tasks for all 5 apps. But running 'pnpm build' in apps/imdbgraph will only run build for imdbgraph)

| Command                 | Action                                          |
| :---------------------- | :---------------------------------------------- |
| `pnpm build`            | Build your production site                      |
| `pnpm typecheck`        | Run TypeScript type checking                    |
| `pnpm format`           | Run Prettier to format                          |
| `pnpm lint`             | Run Oxlint linting rules                        |
| `pnpm test:unit`        | Run unit tests with Vitest                      |
| `pnpm test:integration` | Run integration tests with Vitest               |
| `pnpm e2e`              | Run end-to-end tests with Playwright            |
| `pnpm e2e:update`       | Update Playwright test screenshots              |
| `pnpm verify`           | Run all checks (build, lint, format, typecheck, |
|                         | test, e2e)                                      |

## Tech Stack

| Category       | Technology Used                                          |
| :------------- | :------------------------------------------------------- |
| Language       | TypeScript                                               |
| Frameworks     | React + TanStack Start + Vite                            |
| UI             | Tailwind + Shadcn                                        |
| Testing        | Vitest (Unit/Integration), Playwright (E2E)              |
| Deployment     | Vercel                                                   |
| Package Manger | pnpm (CRITICAL: DO NOT USE npm)                          |
| Task Runner    | Turborepo for Monorepo support + task management/caching |

## Verification

After completing a task, run `pnpm verify` in the relevant app directory to ensure
all checks pass (build, lint, format, typecheck, test, e2e).
