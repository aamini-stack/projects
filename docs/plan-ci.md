# CI: Replace Vercel Deploy With GHCR + Flux MVP

## Summary

Replace the current Vercel-based deploy step in `.github/workflows/ci.yml` with
a GHCR publish flow that:

- builds and pushes each changed app image to `ghcr.io/aamini-stack/<app>`
- tags images as `pr-<PR_NUMBER>` for PRs and `main-<GITHUB_SHA>` for `main`
- renders and publishes the GitOps OCI bundle consumed by Flux as
  `ghcr.io/aamini-stack/projects-gitops:latest`
- publishes the Helm chart OCI artifact
  `ghcr.io/aamini-stack/app-release:<chart-version>`
- runs Playwright immediately after push against the Flux-derived URL, with no
  readiness gate yet

This keeps the existing Flux contract intact:

- stable apps already watch `main-<sha>` tags via `ImagePolicy`
- preview apps already reference `pr-<id>` tags and preview URLs
- the cluster already points at `projects-gitops:latest`

## Implementation Changes

### 1. Rework the E2E job in CI

Update `.github/workflows/ci.yml` so the `e2e` matrix job does this instead of
`vercel link` / `vercel deploy`:

- add `packages: write` permission so GitHub Actions can push to GHCR
- log in to GHCR with `docker/login-action`
- compute deployment metadata per matrix app:
  - PR: `IMAGE_TAG=pr-${{ github.event.pull_request.number }}`
  - `main`: `IMAGE_TAG=main-${GITHUB_SHA}`
  - PR `BASE_URL=https://${APP}-pr-${PR_NUMBER}.preview.ariaamini.com`
  - `main` `BASE_URL=https://${APP}.ariaamini.com`
- build and push the production image from the repo root `Dockerfile` using
  `target=production` and `build-arg APP_NAME=<app>`
- run `pnpm e2e` immediately after the push with `BASE_URL` exported

Representative workflow shape:

```yaml
permissions:
  contents: write
  statuses: write
  packages: write

jobs:
  e2e:
    needs: [find-apps]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: ${{ fromJson(needs.find-apps.outputs.apps) }}
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm i
      - run: pnpm exec playwright install --with-deps chromium

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Compute deploy metadata
        run: |
          APP="${{ matrix.app }}"
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            IMAGE_TAG="pr-${{ github.event.pull_request.number }}"
            BASE_URL="https://${APP}-pr-${{ github.event.pull_request.number }}.preview.ariaamini.com"
          else
            IMAGE_TAG="main-${GITHUB_SHA}"
            BASE_URL="https://${APP}.ariaamini.com"
          fi

          echo "IMAGE_NAME=ghcr.io/aamini-stack/${APP}" >> "$GITHUB_ENV"
          echo "IMAGE_TAG=${IMAGE_TAG}" >> "$GITHUB_ENV"
          echo "BASE_URL=${BASE_URL}" >> "$GITHUB_ENV"

      - name: Build and push app image
        run: |
          docker build \
            --file Dockerfile \
            --target production \
            --build-arg APP_NAME=${{ matrix.app }} \
            --tag ${IMAGE_NAME}:${IMAGE_TAG} \
            .
          docker push ${IMAGE_NAME}:${IMAGE_TAG}

      - name: Run Playwright tests
        working-directory: ./apps/${{ matrix.app }}
        run: pnpm e2e
```

### 2. Add a GitOps artifact publish step

Add a separate non-matrix job, after app image pushes and before or alongside
E2E depending on dependency preference, that publishes the OCI artifacts Flux
consumes.

Add a small CLI entrypoint rather than embedding render logic inline:

- add a script command under `scripts/src` or `packages/infra/src` that calls
  `renderGitopsBundle(...)`
- write rendered output to a temp/dist directory
- package that directory as an OCI artifact and push
  `ghcr.io/aamini-stack/projects-gitops:latest`
- package and push the Helm chart from `packages/infra/charts/app-release`

Expected CLI responsibilities:

- render from `packages/infra/manifests`
- emit bundle with `bootstrap`, `platform-*`, and `apps/applications.yaml`
- not mutate tracked files

Representative TypeScript shape:

```ts
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { renderGitopsBundle } from '../../packages/infra/src/gitops/render'

const repoRoot = process.cwd()
const outDir = path.join(repoRoot, '.tmp', 'gitops-bundle')

mkdirSync(outDir, { recursive: true })

renderGitopsBundle({
	sourceRoot: path.join(repoRoot, 'packages/infra/manifests'),
	outputRoot: outDir,
})
```

Representative workflow shape:

```yaml
publish-gitops:
  runs-on: ubuntu-latest
  needs: [find-apps]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v6
      with:
        node-version: 22
        cache: pnpm
    - run: pnpm i
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Render GitOps bundle
      run:
        pnpm node --experimental-strip-types scripts/src/publish-gitops.ts
        render

    - name: Install Helm
      uses: azure/setup-helm@v4

    - name: Push app-release chart
      run: |
        helm package packages/infra/charts/app-release --destination .tmp/chart
        helm push .tmp/chart/app-release-0.1.0.tgz oci://ghcr.io/aamini-stack

    - name: Push GitOps OCI bundle
      run: |
        tar -C .tmp/gitops-bundle -czf .tmp/projects-gitops.tar.gz .
        oras push ghcr.io/aamini-stack/projects-gitops:latest \
          .tmp/projects-gitops.tar.gz:application/vnd.aamini.gitops.bundle.v1+tar.gz
```

Implementation detail:

- if using `oras`, install it in CI explicitly
- keep the bundle tag fixed at `latest` for MVP, matching `Pulumi.staging.yaml`
  and `aks.ts`
- keep chart version `0.1.0` unless you also choose to version-bump chart
  releases during this change

### 3. Wire job dependencies for MVP behavior

Use job dependencies that match the current request:

- `quality-checks` and `integration-tests` stay unchanged
- app image publishing must happen before the matching app's E2E run
- GitOps OCI publish must happen before E2E if you want the cluster source
  updated first
- do not add any polling or readiness check yet

For the MVP, the simplest structure is:

- `publish-gitops` job
- `e2e` matrix job depends on `find-apps` and `publish-gitops`
- each matrix leg pushes its own app image, then runs tests immediately

That gives you:

- image available in GHCR
- GitOps bundle updated in GHCR
- Playwright starts right away and may race, which is the accepted temporary
  behavior

## Public Interfaces / Contracts

These contracts stay intentionally unchanged:

- app image repositories remain `ghcr.io/aamini-stack/<app>`
- stable tag format remains `main-<sha>`
- preview tag format remains `pr-<pr-number>`
- preview URL format remains `https://<app>-pr-<pr>.preview.ariaamini.com`
- main URL remains `https://<app>.ariaamini.com`
- Flux GitOps source remains `oci://ghcr.io/aamini-stack/projects-gitops:latest`
- Helm chart source remains `oci://ghcr.io/aamini-stack/app-release`

The only new interface is an internal CLI/script for rendering and publishing
the GitOps bundle.

## Test Plan

Run non-mutating validation after implementation:

- `pnpm --filter @aamini/infra test`
- `pnpm --filter @aamini/infra typecheck`
- `pnpm typecheck`
- `pnpm lint`
- inspect the rendered GitOps bundle locally to confirm:
  - `applications.yaml` still contains preview `HelmRelease` resources
  - stable manifests still annotate `aamini.dev/image-policy`
  - chart source still points to `oci://ghcr.io/aamini-stack/app-release`
- run one CI test on a PR and verify:
  - app image is pushed as `ghcr.io/aamini-stack/<app>:pr-<number>`
  - `projects-gitops:latest` is updated
  - E2E uses the preview hostname
- run one CI test on `main` and verify:
  - app image is pushed as `ghcr.io/aamini-stack/<app>:main-<sha>`
  - E2E uses the stable hostname

## Assumptions

- Use `GHCR_TOKEN` for GHCR pushes when package linkage or org package
  permissions make `GITHUB_TOKEN` insufficient.
- Flux already has credentials to pull both `projects-gitops` and app images
  through the existing `ghcr-auth` secret.
- No wait gate, rollout status check, or hostname readiness probe is added in
  this change.
- Chart publishing can reuse the current `0.1.0` version for MVP unless OCI
  registry constraints force version bumps; if that happens, add chart
  versioning as a follow-up instead of changing the deployment contract now.
- If `find-apps` returns package names with the `apps/` prefix rather than bare
  app directory names, normalize that in CI before building tags and URLs.
