# Scripts CLI Refactor - PLAN.md

## Goal

Redesign the aamini CLI with better command grouping and cleaner interfaces.

## New CLI Structure

### Current (6 flat commands)
```
aamini e2e [...]
aamini build [...]
aamini push [...]
aamini seal
aamini unseal
aamini pm [...]
```

### Target (grouped commands)

```
aamini secrets seal
aamini secrets unseal
aamini secrets update

aamini e2e <app> --local
aamini e2e <app> --preview $PR
aamini e2e <app> --staging
aamini e2e <app> --production
aamini e2e --all --local
aamini e2e --all --preview $PR
...

aamini docker build <app>
aamini docker build --all
aamini docker push <app>
aamini docker push --all
aamini docker deploy <app>
aamini docker deploy --all

aamini pm <existing pm flags>
```

## Implementation Tasks

### Task 1: Create commands/ folder structure

```
scripts/src/
├── aamini.ts                    # Thin CLI entry point
├── helpers/
│   ├── repo.ts                  # (existing)
│   ├── docker.ts                # Core docker logic
│   ├── secrets.ts               # Core secrets logic
│   └── ci/
│       ├── preview.ts           # Core preview logic (from actions/preview)
│       ├── events.ts            # Core events logic (from actions/events)
│       └── e2e.ts               # Core e2e logic (from actions/e2e-workflow)
└── commands/                     # CLI entry points
    ├── secrets.ts               # seal, unseal, update
    ├── e2e.ts                   # e2e with --local/--preview/--staging/--production
    ├── docker/
    │   ├── build.ts
    │   ├── push.ts
    │   └── deploy.ts
    ├── pm.ts
    └── ci/
        ├── preview.ts           # create, cleanup, status, gate
        ├── events.ts            # outputs, normalize
        └── e2e.ts              # status
```

### Task 2: Refactor aamini.ts

- Import all commands from commands/
- Use nested command groups (cac supports this)
- Delegate to command handlers

### Task 3: Create helpers/docker.ts

- Move core logic from existing build.ts
- Functions: buildImage, pushImage, getImageRefs, parseApps

### Task 4: Create helpers/secrets.ts

- Move seal/unseal logic from k8secrets.ts
- Functions: sealAll, unsealAll

### Task 5: Create commands/secrets.ts

- Parse args: seal, unseal, update
- Validate app name or --all
- Call helpers/secrets.ts

### Task 6: Refactor commands/e2e.ts

- Parse flags: --local, --preview, --staging, --production
- App from positional arg or --all
- Call appropriate docker compose or deployment target

### Task 7: Create commands/docker/*.ts

- build.ts: parse args → call helpers/docker.ts
- push.ts: parse args → call helpers/docker.ts  
- deploy.ts: parse args → call publish-gitops

### Task 8: Move commands/pm.ts

- Keep as-is, just move to commands/

### Task 9: Create commands/ci/*.ts

- Move logic from actions/preview → helpers/ci/preview.ts
- Move logic from actions/events → helpers/ci/events.ts  
- Move logic from actions/e2e-workflow → helpers/ci/e2e.ts
- Create thin CLI wrappers in commands/ci/

### Task 10: Cleanup

- Delete old build.ts, k8secrets.ts, publish-gitops.ts
- Delete actions/ folder (logic moved to helpers/ci/)
- Delete empty helpers/ folder (old build.ts)

### Task 11: Test & Typecheck

- Run pnpm test
- Run pnpm typecheck

### Task 12: Create scripts/README.md

- Document all CLI commands with usage examples
- Include flags and descriptions
- Be human-readable for new users
- Serve as source of truth for CLI contract

## Notes

- `aamini secrets update` is a stub - implementation empty for now
- `e2e --preview $PR` - takes PR number, looks up preview URL from GitHub deployment
- `docker deploy` - keeps `--deploy-revision` flag
- `aamini ci` commands for GitHub Actions:
  - `aamini ci preview create|cleanup|status|gate`
  - `aamini ci events outputs|normalize`
  - `aamini ci e2e status`
