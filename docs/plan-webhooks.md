# Webhook Plan for Publish, Reconcile, and Deployment-Driven E2E

## Summary

Introduce two webhook handoff points around Flux:

- GitHub Actions -> Flux: notify Flux immediately after images and OCI artifacts
  are published so reconciliation starts without waiting for polling intervals.
- Flux-side notifier -> GitHub Actions: notify GitHub only after a specific app
  revision is actually deployed and reachable, which then triggers app-specific
  e2e tests and commit status updates.

Use Flux `Receiver` resources for the inbound webhook, following the Flux
webhook receiver guide. Use GitHub `repository_dispatch` for the outbound e2e
trigger, because Flux Receivers only solve inbound events to Flux, not outbound
workflow dispatch to GitHub.

## Goals

- Reduce deploy latency after CI publish completes.
- Keep Flux as the source of truth for desired state and reconciliation.
- Trigger e2e from real deployment readiness instead of image push completion.
- Block merges on deployment-driven e2e results, not on speculative CI timing.

## Non-Goals

- Do not have GitHub Actions write Kubernetes manifests directly.
- Do not have Flux itself decide deployment readiness based only on reconcile
  success.
- Do not require per-app dynamic branch protection rules.

## Current State

- CI publishes:
  - app images to `ghcr.io/aamini-stack/<app>`
  - the Helm chart to `ghcr.io/aamini-stack/app-release`
  - the GitOps OCI bundle to `ghcr.io/aamini-stack/projects-gitops:latest`
- Flux already runs:
  - `source-controller`
  - `kustomize-controller`
  - `helm-controller`
  - `notification-controller`
  - `image-reflector-controller`
  - `image-automation-controller`
- Stable app releases consume the `app-release` `OCIRepository`.
- Preview releases are created from `ResourceSet` inputs for GitHub pull
  requests.

## Architecture

### 1. Publish Finished Webhook

After CI finishes pushing images, the chart, and the GitOps bundle, GitHub
Actions calls a Flux `Receiver` endpoint.

The receiver should trigger reconciliation of the Flux source objects that
matter for deployment freshness:

- required:
  - the GitOps bundle `OCIRepository` used by Flux instance sync
- optional:
  - app `ImageRepository` resources if we want immediate image scan refresh in
    addition to the bundle refresh
  - the `app-release` chart `OCIRepository` if chart updates should also be
    refreshed immediately

Recommended first version:

- one receiver in `flux-system`
- target the GitOps bundle `OCIRepository`
- add additional source targets only if polling delay is still visible in
  rollout timing

### 2. Deployment Ready Webhook

After Flux has applied the desired state and a specific app is serving the
expected revision, an in-cluster notifier sends a GitHub `repository_dispatch`
event.

This notifier should not dispatch on reconcile success alone. It must verify:

- the expected app and environment
- the expected SHA or image tag
- the public URL is reachable
- duplicate events for the same app + SHA + environment are suppressed

## Inbound Webhook Design: GitHub Actions -> Flux

### Flux Resources

Add a `Receiver` in `flux-system` managed through the generated GitOps
manifests. Protect it with a token stored in a Kubernetes `Secret`.

The receiver should reference source kinds supported by Flux webhook receivers,
not downstream `HelmRelease` or `Kustomization` objects directly.

Candidate resources:

- `OCIRepository/flux-system` for the GitOps bundle sync source
- `OCIRepository/app-release` for Helm chart refresh
- `ImageRepository/<app>` for image reflector refresh

### Exposure

Expose the receiver with one of:

- `HTTPRoute` behind the existing ingress path
- `Ingress`
- `LoadBalancer`

Preferred approach:

- publish a small authenticated HTTPS endpoint under the existing cluster edge
- restrict access to GitHub Actions by shared secret and, if practical,
  additional network filtering

### GitHub Actions Changes

Update `.github/workflows/ci.yml`:

- keep the existing publish steps
- add a final step, only after all pushes succeed, to `POST` to the Flux
  receiver endpoint
- fail the job if the webhook call does not return `2xx`

Payload strategy:

- simplest: call the receiver URL with the token only
- better later: include metadata headers or JSON body for observability, while
  keeping Flux reconciliation tied to the configured receiver resources

### Secrets

- GitHub secret: `FLUX_RECEIVER_TOKEN`
- GitHub secret or variable: `FLUX_RECEIVER_URL`
- Kubernetes secret in `flux-system` containing the same token

## Outbound Webhook Design: Flux Side -> GitHub Actions

### Trigger Mechanism

Use GitHub `repository_dispatch`, not a Flux Receiver, for the outbound path.

Recommended event:

- `event_type: app_deploy_ready`

### Payload Contract

Send exactly one app per event:

- `client_payload.app`
- `client_payload.environment`
- `client_payload.url`
- `client_payload.sha`
- `client_payload.pr_number` for previews
- `client_payload.image_tag`
- `client_payload.source` set to something like `flux-deploy-ready`

### Readiness Notifier

Implement a small in-cluster service, job, or controller that watches Flux
outputs and app readiness.

Inputs it can use:

- `HelmRelease` state
- workload status
- preview annotations already rendered into preview `HelmRelease` metadata:
  - `event.toolkit.fluxcd.io/change_request`
  - `event.toolkit.fluxcd.io/commit`
  - `event.toolkit.fluxcd.io/preview-url`

Responsibilities:

- map deployment state to app + SHA + environment + URL
- poll or probe the final hostname before dispatch
- deduplicate events
- authenticate to GitHub with a dedicated token

### GitHub Workflow

Add `.github/workflows/e2e-on-deploy-ready.yml`:

- trigger on `repository_dispatch`
- validate payload fields
- run only the named app's Playwright suite against `client_payload.url`
- publish commit statuses

Required statuses:

- `e2e/<app>`
- `e2e/all-required`

## Merge Blocking Model

Branch protection should require:

- `quality-checks`
- `integration-tests`
- `e2e/all-required`

Do not require dynamic per-app `e2e/<app>` contexts directly. The changed app
set varies by PR, so the stable merge gate must be the aggregate status.

## Resource Targeting Recommendation

Start with this minimal path:

1. CI publishes images, chart, and GitOps bundle.
2. CI calls one Flux `Receiver`.
3. That receiver refreshes the GitOps bundle `OCIRepository`.
4. Flux applies the updated desired state.
5. The readiness notifier dispatches `app_deploy_ready` per app.
6. GitHub runs e2e and updates commit statuses.

Why start here:

- it is the smallest change to the current design
- the GitOps bundle is already the top-level sync source for Flux
- it avoids premature complexity around separate image/chart refresh webhooks

Only add `ImageRepository` receiver targets if rollout delay analysis shows the
bundle refresh alone is insufficient.

## Implementation Changes

- Infra / manifests:
  - add a `Receiver`
  - add a secret for receiver auth
  - add a route for the receiver endpoint
- GitOps rendering:
  - generate receiver and related secret references in
    `packages/infra/src/gitops/render.ts`
- Pulumi:
  - wire any required secrets or route exposure through
    `packages/infra/src/aks.ts`
- GitHub Actions:
  - add a webhook POST step to `.github/workflows/ci.yml`
  - add `e2e-on-deploy-ready.yml`
- Cluster notifier:
  - add a service or job that emits `repository_dispatch`

## Security

- Use separate credentials for:
  - Flux inbound receiver authentication
  - GitHub outbound dispatch from the cluster
- Scope the GitHub token used by the notifier to repository dispatch and status
  updates only if possible.
- Do not expose unauthenticated public receiver endpoints.
- Log webhook requests and responses without leaking secrets.

## Observability

- CI logs should show:
  - publish success
  - Flux webhook invocation
  - response code from the receiver
- Cluster logs/events should show:
  - receiver acceptance
  - source reconciliation after webhook
  - readiness notifier dispatch attempts
- GitHub should show:
  - `repository_dispatch` triggered workflow runs
  - per-app and aggregate e2e statuses on the commit SHA

## Rollout Plan

1. Add the Flux `Receiver` and expose it securely.
2. Add the CI step that calls the receiver after publish completes.
3. Verify webhook-triggered source reconciliation in staging.
4. Add the deployment readiness notifier in-cluster.
5. Add the `repository_dispatch` e2e workflow.
6. Add `e2e/all-required` status handling.
7. Update branch protection to require `e2e/all-required`.

## Test Plan

- Inbound webhook:
  - manually call the Flux receiver and verify the targeted source reconciles
  - verify bad or missing token requests are rejected
  - verify CI fails clearly if the receiver call fails
- Deployment-ready dispatch:
  - send a sample `repository_dispatch` payload and verify only one app e2e run
    starts
  - verify the workflow uses the payload URL, not guessed URLs
- End-to-end:
  - publish from CI
  - observe Flux webhook-triggered reconcile
  - observe deployment-ready dispatch after the app is reachable
  - verify e2e results update commit statuses correctly
- Merge gating:
  - verify `e2e/all-required` stays pending until all required app runs finish
  - verify a failed app sets `e2e/all-required` to failure
  - verify branch protection blocks merge until `e2e/all-required` succeeds

## Open Questions

- Should the first receiver target only the GitOps bundle `OCIRepository`, or
  also `app-release` and per-app `ImageRepository` objects?
- Should preview and stable deployments use one shared receiver or separate
  endpoints?
- Should the readiness notifier be a long-running controller, a CronJob-like
  poller, or a one-shot job triggered off Flux events?
- Where should the expected changed app set for `e2e/all-required` be persisted
  so the e2e workflow can compute the aggregate status reliably?
