# Scripts

CLI tools for managing this monorepo.

## Install

```bash
# Ensure pnpm is installed
pnpm install
```

## Commands

### Secrets

Manage Kubernetes secrets.

```
aamini secrets seal
aamini secrets unseal
```

### PM

Task manager.

```
aamini pm next
aamini pm progress
aamini pm wipe
aamini pm show <id>
aamini pm update <id> <field> <value>
aamini pm done [task-id] [commit-sha] [notes]
aamini pm done '{"task": 1, "status": "done", "sha": "abc", "notes": "..."}'
aamini pm blocked <id> [notes]
aamini pm ci
```

See `aamini pm --help` for more.

### CI

GitHub Actions entrypoints.

```
aamini ci preview create
aamini ci preview cleanup
aamini ci preview status
aamini ci preview gate
aamini ci events outputs
aamini ci events normalize
aamini ci e2e status
```

### E2E

Run end-to-end tests against apps.

```
aamini e2e <app> [--local|--preview <pr>|--staging|--production]
aamini e2e --all [--local|--preview <pr>|--staging|--production]
```

### Docker

Build, push, and deploy Docker images and k8 manifests into OCI.

```
aamini docker build <app> [--all]
aamini docker push <app> [--all]
aamini docker deploy [--all] [--deploy-revision <sha>]
```

## Environment Variables

| Variable             | Description                | Default            |
| -------------------- | -------------------------- | ------------------ |
| `GH_TOKEN`           | GitHub token for API calls | Required           |
| `ECR_REGISTRY`       | Docker registry            | `docker.io/aamini` |
| `IMAGE_TAG`          | Docker image tag           | `latest`           |
| `DOCKER_PUSH_LATEST` | Push `:latest` tag         | `true`             |
| `DOCKER_PLATFORM`    | Docker build platform      | `linux/amd64` (CI) |
