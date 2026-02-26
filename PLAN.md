# Preview Apps

## Summary

Implement PR previews for my new internal AKS PaaS. Knative is used for true
serverless behavior (scale-to-zero + request-driven scale-up) to enable 100s of
preview environments.

## Features/Details

- Each changed app in a PR gets a preview URL: `<branch>.<app>.ariaamini.com`
- Only changed apps are built/deployed (Diff against the previous commit instead
  of main).
- Docker build/push is done on CI and pushed images are fetched using Flux image
  automation. A webhook will be fired from CI after images are built for instant
  notification to flux.
- CI will use git commit statuses to communication deployment status. Once the
  commit status is green, the e2e tests will run.
- PRs should have status checks to prevent undeploy/untested PRs from being
  merged.

## Implementation Notes

- Baseline for changed-app detection is `HEAD~1..HEAD` (or PR equivalent
  previous commit), not `main...HEAD`, to avoid rebuilding unaffected apps.
- CI should emit a machine-readable matrix artifact (app name + image tag +
  preview URL) so later jobs can consume one canonical payload.
- Image tagging should be deterministic and traceable (for example:
  `<app>:pr-<number>-<shortsha>`), and Flux should only track those preview tag
  patterns.
- Flux webhook trigger should run immediately after image push to reduce
  reconciliation latency compared to polling alone.
- Knative preview revisions should include:
  - `autoscaling.knative.dev/min-scale: "0"`
  - `autoscaling.knative.dev/max-scale: "5"`
  - `autoscaling.knative.dev/target: "50"`
  - `autoscaling.knative.dev/scale-down-delay: "2m"`
- Preview lifecycle needs explicit cleanup on PR close/merge to avoid orphaned
  services, DNS records, and image churn.
- Branch protection should require both deployment and e2e checks so unready PRs
  cannot merge.

## Knative Performance Profile

- Defaults for preview services:
  - `autoscaling.knative.dev/min-scale: "0"`
  - `autoscaling.knative.dev/max-scale: "5"` (per preview, tunable)
  - `autoscaling.knative.dev/target: "50"` (target concurrency)
  - `autoscaling.knative.dev/scale-down-delay: "2m"` (reduce flapping)
- Cold-start controls:
  - keep image small and startup path minimal.
  - avoid blocking startup on heavy migrations.
  - add optional warmup probe job for labeled PRs.

## Sources

- Knative autoscaling concepts and annotations:
  <https://knative.dev/docs/serving/autoscaling/autoscaling-concepts/>
- Flux image automation components: <https://fluxcd.io/flux/components/image/>
- Flux notification/webhook receiver:
  <https://fluxcd.io/flux/components/notification/receivers/>
- GitHub commit statuses/checks behavior:
  <https://docs.github.com/en/rest/commits/statuses>
- GitHub branch protection required status checks:
  <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches>
