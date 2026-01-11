# Per-App Devcontainer Design

## Goal

Speed up devcontainer startup by building only the app you're working on, not the entire monorepo.

## Architecture

Single dynamic Dockerfile that requires an `APP_NAME` build argument. Six devcontainer configs (one per app) under `.devcontainer/` subdirectories, each passing a different app name.

```
.devcontainer/
  dota-visualizer/devcontainer.json
  paas/devcontainer.json
  imdbgraph/devcontainer.json
  pc-tune-ups/devcontainer.json
  ducky-mot/devcontainer.json
  portfolio/devcontainer.json
  Dockerfile
  init-firewall.sh
```

VS Code detects multiple configs and prompts which one to use. No fallback to full build - every devcontainer must specify an app.

## Dockerfile Changes

1. Add `APP_NAME` as required build arg with validation
2. Replace `turbo prune --docker` with `turbo prune @aamini/${APP_NAME} --docker`
3. Everything else stays the same

```dockerfile
ARG APP_NAME
RUN if [ -z "$APP_NAME" ]; then \
      echo "ERROR: APP_NAME build argument is required" && exit 1; \
    fi

# Later in the file:
RUN pnpm dlx turbo prune @aamini/${APP_NAME} --docker
```

Turbo prune analyzes the dependency graph and creates `out/json/` and `out/full/` with only the needed packages. The existing COPY and build steps work unchanged.

## Devcontainer Config Structure

Each app's config is nearly identical, with only the name and APP_NAME changing:

```json
{
  "name": "dota-visualizer",
  "build": {
    "context": "../..",
    "dockerfile": "../Dockerfile",
    "args": {
      "APP_NAME": "dota-visualizer",
      "TZ": "${localEnv:TZ:America/Los_Angeles}",
      "CLAUDE_CODE_VERSION": "latest",
      "GIT_DELTA_VERSION": "0.18.2",
      "ZSH_IN_DOCKER_VERSION": "1.2.0"
    }
  },
  "runArgs": ["--cap-add=NET_ADMIN", "--cap-add=NET_RAW"],
  "remoteUser": "node",
  // ... (mounts, containerEnv - all unchanged from current config)
}
```

Key details:
- Build context is repo root (needed for turbo prune)
- Dockerfile path is relative to the config location
- All other settings (mounts, env vars, etc.) identical across apps

## Workspace Setup

- **Workspace folder:** Stays at `/workspace` (monorepo root)
- **Shared packages:** Remain accessible in `/packages`
- **postStartCommand:** Remove `pnpm i` (already done in Dockerfile), keep only firewall script

```json
"postStartCommand": "sudo /usr/local/bin/init-firewall.sh"
```

## Error Handling

1. **Invalid APP_NAME:** Turbo prune fails with `Could not find package @aamini/xxx`
2. **Missing APP_NAME:** Dockerfile validation fails with clear error message
3. **First-time setup:** VS Code prompts to select a config by name

## Migration Plan

1. Keep current `.devcontainer/devcontainer.json` as backup
2. Create new structure (6 configs + updated Dockerfile)
3. Test with dota-visualizer first
4. Verify: faster startup, build works, shared packages accessible
5. Roll out to remaining 5 apps
6. Remove old root devcontainer.json

Rollback: Revert changes via git if needed.

## Expected Benefits

- **Faster startup:** Only installs/builds one app instead of all 6
- **Single Dockerfile:** One file to maintain, consistent behavior
- **Clear selection:** VS Code prompt shows which app you're working on
- **Monorepo context:** Still have access to shared packages and full repo
