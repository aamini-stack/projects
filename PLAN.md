# Implement PaaS/Deployment Pipeline

## Summary/Goal

The goal of this PR is to move away from Vercel and instead self host my apps on
my own kubernetes cluster. This will involve changes to my Github Actions and
how my FluxCD setup. The main functionality I want to focus on for the first MVP
is a fully functional pipeline that:

- Detects and only deploys changed apps using Turborepo for change detection
- A new docker build/push job.
- Some way for the cluster to automatically pick up and deploy new images
- Deployments on PRs should deploy to an ephemeral environment with a unique
  URL: `<branch-name>.<app-name>.ariaamini.com`
- Support for Knative. Being able to efficiently support 100s of ephemeral
  environments using scale-to-zero technology is important.

## Plan

- Add a new docker build/push job to CI. This new job will depend on the quality
  checks and integration tests passing first. This might require a matrix job
  like with how the e2e job works. Reuse the existing change detection in
  find-apps
- The e2e jobs will need to change how they work. Previously they relied on the
  deploy job finishing before running the e2e tests. This was necessary since
  the e2e tests relied on real deployed staging/preview URLs. Now, we need to
  rethink how the e2e job will detect when a deployment is ready to test
  against. This will likely involve git commit statuses, github action events or
  webhooks.
- We need to find a way to architect Flux to pick up the new images that were
  built/pushed in CI. I know Flux has image automation but I'm not a fan since
  it's a little noisy when it comes to git history. I think a better choice
  would be Flux operator which seems to support ephemeral apps and git-less
  gitops.

## Follow-ups

- Fix Cloudflare origin connectivity for `*.ariaamini.com`. As of March 10,
  2026, the Gateway/Traefik origin at `20.237.208.123` responds directly, but
  the proxied Cloudflare path still returns `522`.
- Add stale preview cleanup for orphaned PR environments like `pr-134`. The
  current cleanup workflow only runs on `pull_request.closed`, which is not
  enough to remove broken preview HTTPRoutes and workloads when preview state
  drifts.
- Decide whether stale preview cleanup should delete orphan ResourceSet outputs,
  prune missing `pr-*` tags from GHCR references, or periodically reconcile
  preview resources against the active PR set.
