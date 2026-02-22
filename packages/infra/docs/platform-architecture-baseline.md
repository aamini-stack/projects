# Platform Architecture Baseline

This baseline defines the contract for running application workloads on AKS using Knative Serving and Flux GitOps. It is the source of truth for promotion flow, naming, and tenant/security boundaries.

## Scope

- Runtime: AKS + Knative Serving
- Delivery: Flux GitOps with image automation
- Environments: preview, staging, production

## Runtime Contract for Apps

Every onboarded app must satisfy the following runtime contract:

- **Container port**: app must listen on `PORT` (default `8080`).
- **Bind address**: app must bind `0.0.0.0`.
- **Startup**: app must be able to start without interactive setup and be ready for traffic within 60 seconds.
- **Health probes**:
  - Readiness: `GET /healthz/ready` returns `200` when app can serve requests.
  - Liveness: `GET /healthz/live` returns `200` while app process is healthy.
- **Shutdown**: app should honor SIGTERM and drain in-flight requests within 20 seconds.
- **Required env vars**:
  - `PORT` (injected by runtime)
  - `NODE_ENV` (`production` in staging/production, `preview` in previews)
  - `APP_NAME` (stable service identifier)
  - `APP_ENV` (`preview` | `staging` | `production`)
- **Optional env vars**:
  - `LOG_LEVEL` (default `info`)
  - `OTEL_EXPORTER_OTLP_ENDPOINT` when tracing is enabled
- **Stateless behavior**: app instances must not depend on local writable disk persistence.

## Environment Model and URL Conventions

Deployment environments and routes are fixed as:

- **Preview**: per pull request, ephemeral.
  - Namespace pattern: `preview-pr-<number>`
  - Host pattern: `<pr-number>.<app>.preview.ariaamini.com`
- **Staging**: shared pre-production.
  - Namespace: `staging`
  - Host pattern: `<app>.staging.ariaamini.com`
- **Production**: customer-facing stable.
  - Namespace: `prod`
  - Host pattern: `<app>.ariaamini.com`

Promotion model:

1. CI publishes immutable images.
2. Preview deploys from PR-scoped manifests.
3. Staging promotion is a git change to staging policy/manifests.
4. Production promotion is a git change after staging validation.

No environment deploys directly from mutable tags.

## Image Tagging Strategy

Image tags are split into immutable and optional channel tags.

- **Immutable tag (required)**: `sha-<gitsha12>`.
- **Optional channel tags** (human-friendly only): `preview`, `staging`, `prod`.
- **OCI labels required on pushed images**:
  - `org.opencontainers.image.revision`
  - `org.opencontainers.image.source`
  - `org.opencontainers.image.created`

Flux policy selection must target immutable tags (regex `^sha-[a-f0-9]{12}$`). Channel tags may be pushed for observability but are not deploy targets.

## Multi-Tenant Namespace and Secret Model

Tenant isolation and secret handling rules:

- Namespace ownership:
  - Each app gets its own service account and RBAC role in each environment namespace.
  - Cross-app RBAC access is denied by default.
- Secret model:
  - Shared secrets by environment live in `shared-<env>` (for platform-level values only).
  - App-specific secrets live in `<app>-<env>` secret objects.
  - Preview secrets are generated per PR namespace and garbage-collected on preview cleanup.
- Access boundaries:
  - Workloads may mount/read only app-specific and explicitly allowed shared secrets.
  - Production secrets are never referenced from preview or staging namespaces.
- Naming:
  - Namespace: `<env>` or `preview-pr-<number>`
  - Service account: `sa-<app>`
  - Secret: `<app>-<env>-<purpose>`

## Platform SLOs

Baseline SLO targets:

- **Flux reconcile latency**:
  - P95 <= 2 minutes from image publish/git update to applied manifests.
  - P99 <= 5 minutes.
- **Deployment readiness**:
  - P95 <= 3 minutes from reconcile start to Knative Service `Ready=True` for warm image.
- **Cold-start latency**:
  - P95 <= 2 seconds for lightweight services.
  - P95 <= 5 seconds for standard services.
  - Any service exceeding 5 seconds at P95 needs mitigation (`min-scale: 1`, image slimming, or startup optimization).

These SLOs are the default acceptance bar for platform changes and onboarding of new apps.
