## Serverless PaaS on AKS (GitOps + Knative + Flux)

### Goal

Build an internal serverless PaaS on top of AKS where apps are deployed as Knative Services, images are built in CI, release state is managed through GitOps, and Flux automation keeps workloads aligned with published images.

This keeps the platform request-driven, cost-efficient at idle (scale-to-zero), and operationally consistent across many services.

### Is the previous plan still viable?

Yes. The previous PR preview plan is still a viable foundation and can be promoted into a broader platform plan.

What still works:

- Knative on AKS is the right runtime for HTTP scale-to-zero workloads.
- GitHub Actions -> registry push -> Flux reconcile remains a solid CI/CD bridge.
- Flux Receiver webhook is still useful for fast post-commit convergence.
- Preview environments remain a strong first PaaS capability and validation path.

What needed cleanup:

- Separate platform-wide architecture from the preview-only workflow.
- Add first-class image automation (Flux ImageRepository/ImagePolicy/ImageUpdateAutomation).
- Clarify CI contract for immutable tagging and metadata.
- Define clear implementation phases and acceptance criteria.

### Target Architecture

- Runtime: Knative Serving on AKS for app workloads.
- Delivery model: GitOps via Flux (desired state in git, cluster pulls and applies).
- Image flow:
  1. CI builds and pushes immutable image tags (for example `sha-<shortsha>`).
  2. Flux image-reflector scans registry tags.
  3. Flux image policy selects the deployable tag.
  4. Flux image automation updates git manifests.
  5. Flux reconcile applies changes to AKS.
- Triggering:
  - Primary: automatic polling/scan intervals.
  - Fast path: webhook from CI to Flux Receiver to trigger immediate reconcile.
- Exposure:
  - Preview URLs: `<branch-slug>.<app>.ariaamini.com`.
  - Stable env URLs follow existing domain routing patterns.

### Delivery Phases

#### Phase 1 - Platform Foundation

- Install/validate Knative Serving on AKS with ingress and TLS.
- Define baseline Knative autoscaling defaults:
  - `min-scale: 0`
  - `max-scale: 5` (override per app when needed)
  - `target: 50`
  - `scale-down-delay: 2m`
- Create shared platform namespaces/secrets/config conventions.

#### Phase 2 - CI Build and Push Stage

- Add CI stage to build and push OCI images for changed apps.
- Publish immutable tags plus OCI labels (commit SHA, repo, build time).
- Optionally publish a mutable channel tag (`preview`, `staging`) for human ergonomics, but deploy from immutable policy.

#### Phase 3 - GitOps and Image Automation

- Add Flux `ImageRepository` per app (or per registry scope).
- Add Flux `ImagePolicy` to select tags (for example semver, regex, or branch-aware patterns).
- Add Flux `ImageUpdateAutomation` to patch manifests in git.
- Add Flux `Receiver` and CI webhook call for low-latency reconcile.

#### Phase 4 - Preview Environment Productization

- Detect changed apps in PRs.
- Render Knative preview manifests under `packages/infra/manifests/previews/pr-<num>/`.
- Commit preview state and trigger Flux.
- Post readiness + URLs back to PR.
- Cleanup on PR close/merge and run scheduled TTL garbage collection.

#### Phase 5 - Operations and Guardrails

- Define SLOs and alerts (reconcile health, Knative readiness, cold-start latency).
- Add quotas/limits and security boundaries for multi-team tenancy.
- Document onboarding contract for new apps.

### CI/CD Contract (Minimal)

- CI must output:
  - image repository
  - immutable tag(s)
  - commit SHA
  - environment target
- GitOps repo must contain:
  - Knative Service manifests per app/environment
  - Flux image automation resources
  - Kustomization wiring
- Reconcile trigger:
  - CI sends webhook to Flux Receiver after push/commit.

### Risks and Mitigations

- Cold starts for heavy apps -> keep images lean; label-based `min-scale: 1` for priority apps.
- Registry/API throttling at scale -> concurrency limits + retries + backoff in CI.
- Drift between CI and GitOps state -> immutable tags and policy-driven promotion only.
- Preview sprawl -> mandatory TTL + cleanup controller/workflow.

### Success Criteria

- Apps deploy as Knative Services and scale to zero when idle.
- CI reliably builds and pushes immutable images for changed apps.
- Flux image automation updates manifests and reconciles without manual edits.
- Webhook-triggered reconcile shortens time-to-preview/update.
- PR previews are created, updated, and garbage-collected automatically.
