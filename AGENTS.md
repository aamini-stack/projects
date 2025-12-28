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

## Issue Tracking

This project uses **bd (beads)** for issue tracking. Run `bd prime` for workflow
context, or install hooks (`bd hooks install`) for auto-injection.

**Quick reference:**

- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd sync` - Sync with git (run at session end)

For full workflow details: `bd prime`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT
complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs
   follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
