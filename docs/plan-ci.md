# Refactor CI Around Turbo + Deployment-Driven E2E

## Summary

Refactor `.github/workflows/ci.yml` to remove the `find-apps` job and stop
using a custom app matrix for deploy/e2e orchestration. Keep CI focused on
repo-local work: install, quality checks, integration tests, and publishing the
GitOps bundle. Move e2e execution behind a deployment completion signal by
introducing a separate workflow triggered by `repository_dispatch`, with
AKS/Flux emitting one event per app when that app is actually serving the
target PR or commit revision.

## Implementation Changes

- Simplify `ci.yml`:
  - delete `find-apps` and all `needs.find-apps.outputs.*` usage
  - keep `quality-checks` and `integration-tests` as straightforward
    Turbo-based jobs
  - keep `publish-gitops` as the workflow step that updates the cluster's
    desired state
  - remove the current `e2e` job from `ci.yml`; it is coupled to image push
    timing rather than deployment readiness
- Add a new workflow, for example `.github/workflows/e2e-on-deploy-ready.yml`:
  - trigger on `repository_dispatch`
  - accept a single app per event and run only that app's Playwright suite
  - reconstruct `BASE_URL` from the dispatch payload instead of guessing from
    the GitHub event context
  - validate the payload early and no-op or fail fast if required fields are
    missing
- Define a stable dispatch contract from AKS/Flux to GitHub:
  - `event_type`: `app_deploy_ready`
  - `client_payload.app`: app name
  - `client_payload.environment`: `preview` or `stable`
  - `client_payload.url`: resolved public URL to test
  - `client_payload.sha`: deployed git SHA
  - `client_payload.pr_number`: PR number for previews, omitted for `main`
  - `client_payload.image_tag`: deployed image tag (`pr-<id>` or `main-<sha>`)
- Add an in-cluster readiness notifier:
  - run a small watcher or job in AKS that observes the deployed app revision
    and emits `repository_dispatch` only after the app is reachable and matches
    the expected SHA or tag
  - use the deployed workload or `HelmRelease` plus an HTTP readiness probe
    against the final hostname as the source of truth; do not dispatch merely
    because GitOps accepted the desired state
  - deduplicate by app + SHA + environment so repeated reconciliations do not
    spam GitHub
  - authenticate to GitHub with a dedicated token or secret scoped to
    dispatching workflow events
- Keep Turbo as the change detector:
  - repo-local CI jobs continue to rely on Turbo task graph or filtering
  - the deployment-ready workflow does not need `find-apps`; each dispatch
    already names the single app whose deployment is ready

## Public Interfaces / Contract Changes

- GitHub Actions interface changes:
  - `ci.yml` no longer exposes or consumes `find-apps` outputs
  - add a new external trigger: `repository_dispatch` with
    `event_type=app_deploy_ready`
- Cluster-to-GitHub contract:
  - the AKS or Flux-side notifier must send the exact payload fields above
  - the notifier is responsible for sending one event per app deployment
    readiness, not batching apps
- E2E workflow behavior:
  - e2e no longer starts immediately after image push
  - e2e starts only after deployment completion is confirmed for the exact
    app or revision under test

## Test Plan

- Workflow validation:
  - confirm `ci.yml` runs successfully on PR and `main` without `find-apps`
  - confirm `publish-gitops` still runs after quality or integration jobs as
    intended
- Dispatch workflow:
  - manually trigger with a sample `repository_dispatch` payload for one
    preview app and verify the workflow computes the right `BASE_URL` and runs
    only that app's e2e
  - repeat for a stable or `main` payload
- Notifier behavior:
  - verify a ready preview deployment emits exactly one dispatch for a new PR
    SHA
  - verify a redeploy with the same SHA does not emit duplicates
  - verify a failed or unreachable deployment does not dispatch e2e
- End-to-end acceptance:
  - PR flow: publish GitOps bundle -> Flux reconciles preview -> app becomes
    reachable -> dispatch fires -> e2e runs against preview URL
  - `main` flow: publish GitOps bundle -> stable app reconciles -> dispatch
    fires -> e2e runs against stable URL only after rollout completes

## Assumptions

- The preferred design is `repository_dispatch`, modeled after
  deployment-driven preview testing rather than in-workflow polling.
- Dispatches are emitted per app readiness, not batched per PR.
- The readiness notifier can be implemented in-cluster with access to GitHub
  credentials and enough cluster or app metadata to map deployment state to
  app + SHA + URL.
- Turbo remains the mechanism for local CI task scoping; the explicit app
  matrix is intentionally removed rather than replaced with another custom
  discovery job.
