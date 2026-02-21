## PR Preview Environments on AKS with Flux + GitHub Actions + Knative

### Summary

Implement PR previews as GitOps-managed Knative services on AKS, with CI pushing image/manifests and Flux pulling/applying state.  
Each changed app in a PR gets a preview URL:

`<sanitized-branch>.<app>.ariaamini.com`

Knative is required for true serverless behavior (scale-to-zero + request-driven scale-up) at 100s preview environments.

### Core Architecture (Locked)

- Preview scope: changed apps only.
- Runtime: Knative Serving for preview workloads (not Deployments).
- CI→CD bridge: GitHub Actions commits preview state + Flux Receiver webhook.
- Secrets: shared per-app preview secrets.
- Data deps: shared staging services.
- Cleanup: PR close/merge + 24h TTL GC.

### Why Knative (vs vanilla)

- Vanilla Kubernetes + HPA: autoscale yes, but no robust HTTP-driven scale-to-zero.
- Knative: built-in scale-to-zero, activator queueing, revision routing, and better density/cost profile for many mostly-idle previews.

### Knative Performance Profile (New)

- Defaults for preview services:
  - `autoscaling.knative.dev/min-scale: "0"`
  - `autoscaling.knative.dev/max-scale: "5"` (per preview, tunable)
  - `autoscaling.knative.dev/target: "50"` (target concurrency)
  - `autoscaling.knative.dev/scale-down-delay: "2m"` (reduce flapping)
- For “priority demo” PRs via label:
  - set `min-scale: 1` for selected apps.
- Cold-start controls:
  - keep image small and startup path minimal.
  - avoid blocking startup on heavy migrations.
  - add optional warmup probe job for labeled PRs.

### CI/CD Flow

1. PR event → detect changed apps.
2. Build/push immutable image tags (`sha-<shortsha>`) to registry.
3. Render Knative preview manifests under `packages/infra/manifests/previews/pr-<num>/`.
4. Commit to `preview-state` branch.
5. Trigger Flux Receiver webhook.
6. Poll readiness:

- Flux Kustomization Ready
- Knative Service Ready
- HTTP smoke at preview URL

7. Post GitHub Deployment status + sticky PR comment with URLs.
8. On PR close, remove manifest dir and reconcile; scheduled GC removes stale TTL previews.

### Public Interfaces / Additions

- Workflows:
  - `.github/workflows/preview-pr.yml`
  - `.github/workflows/preview-cleanup.yml`
  - `.github/workflows/preview-gc.yml`
- Scripts:
  - `scripts/preview/changed-apps.ts`
  - `scripts/preview/sanitize-branch.ts`
  - `scripts/preview/render-manifests.ts`
- Flux additions:
  - Preview `Kustomization` targeting `preview-state` branch/path.
  - Flux `Receiver` for webhook-triggered reconcile.
- Knative package manifests managed by Flux in infra package set.

### URL and Naming Rules

- Hostname: `<branch-slug>.<app>.ariaamini.com`
- Branch slug: lowercase, DNS-safe, <=63 chars, hash suffix on truncation/collision.
- Deployment env name: `pr-<num>-<app>`
- Commit status context: `preview/<app>`

### Test Scenarios

- Single-app PR creates one Knative preview and URL.
- Multi-app PR creates independent previews/statuses per app.
- Branch with slashes/long names yields valid deterministic host.
- Re-push updates revision/image without URL change.
- PR close removes resources and invalidates URL.
- TTL GC cleans stale previews if close hook missed.
- 100+ concurrent idle previews remain mostly scaled to zero.
- Burst traffic scales previews up and serves successfully.

### Assumptions

- Existing wildcard DNS/TLS and Traefik gateway remain in place.
- Registry throughput is sufficient for concurrent PR builds.
- Shared preview secrets are safe for PR-level exposure.
