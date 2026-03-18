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
aamini secrets seal [app]
aamini secrets seal --all
aamini secrets unseal [app]
aamini secrets unseal --all
aamini secrets update --all
```

### PM

Task manager.

```
aamini pm next|progress|wipe|show|update|done|blocked|ci
```

See `aamini pm --help` for more.

### CI

GitHub Actions entrypoints.

```
aamini ci preview create|cleanup|status|gate ...
aamini ci events outputs|normalize ...
aamini ci e2e status ...
```

### E2E

Run end-to-end tests against apps. Defaults to `--local`.

```
aamini e2e <app> [--local|--preview <pr>|--staging|--production]
aamini e2e --all [--local|--preview <pr>|--staging|--production]
```

### Docker

Build, push, and deploy Docker images and k8 manifests into OCI.

```
aamini docker build <app|--all>
aamini docker push <app|--all>
aamini docker deploy <app|--all> [--deploy-revision <sha>]
```

## Environment Variables

| Variable             | Description                | Default            |
| -------------------- | -------------------------- | ------------------ |
| `GH_TOKEN`           | GitHub token for API calls | Required           |
| `ECR_REGISTRY`       | Docker registry            | `docker.io/aamini` |
| `IMAGE_TAG`          | Docker image tag           | `latest`           |
| `DOCKER_PUSH_LATEST` | Push `:latest` tag         | `true`             |
| `DOCKER_PLATFORM`    | Docker build platform      | `linux/amd64` (CI) |
