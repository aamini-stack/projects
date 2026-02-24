## CI/CD Docker Pipeline with FluxCD Image Automation

### Summary

Main branch pushes trigger Docker builds for changed apps. FluxCD detects new images and auto-updates deployments via GitOps.

### Architecture

```
Push to main
    ↓
CI: docker-build (changed apps via turbo filter)
    ↓
Docker Hub: sha-<shortsha> tag
    ↓
CI: Trigger Flux webhook
    ↓
Flux: ImageRepository scans registry
    ↓
Flux: ImagePolicy selects latest sha-* tag
    ↓
Flux: ImageUpdateAutomation commits to staging branch
    ↓
Flux: GitRepository syncs (webhook-triggered)
    ↓
K8s: Deployment rolls out new pod
```

### Versioning

| Tag              | Example       | Purpose                            |
| ---------------- | ------------- | ---------------------------------- |
| `sha-<shortsha>` | `sha-abc1234` | Immutable, traceable to git commit |

### Flux Components Required

| Component               | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `ImageRepository`       | Scans Docker Hub for new tags at configurable interval       |
| `ImagePolicy`           | Selects latest tag matching pattern (regex/semver/numerical) |
| `ImageUpdateAutomation` | Commits updated image tags back to git                       |
| `Receiver`              | Webhook endpoint for immediate reconciliation                |

### Image Policy Marker Format

Place inline comments in YAML manifests to mark update targets:

```yaml
# Full image reference (name:tag)
image: docker.io/aamini/imdbgraph:sha-abc1234 # {"$imagepolicy": "flux-system:imdbgraph"}

# For kustomization.yaml with separate name/tag:
images:
  - name: docker.io/aamini/app
    newName: docker.io/aamini/imdbgraph # {"$imagepolicy": "flux-system:imdbgraph:name"}
    newTag: sha-abc1234 # {"$imagepolicy": "flux-system:imdbgraph:tag"}
```

### ImagePolicy for SHA Tags

```yaml
apiVersion: image.toolkit.fluxcd.io/v1
kind: ImagePolicy
metadata:
  name: imdbgraph
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: imdbgraph
  filterTags:
    pattern: '^sha-(?P<sha>[a-fA-F0-9]+)$'
    extract: '$sha'
  policy:
    alphabetical:
      order: asc
```

### ImageUpdateAutomation Configuration

```yaml
apiVersion: image.toolkit.fluxcd.io/v1
kind: ImageUpdateAutomation
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 1m
  sourceRef:
    kind: GitRepository
    name: flux-system
  git:
    checkout:
      ref:
        branch: staging
    commit:
      author:
        email: fluxcdbot@users.noreply.github.com
        name: fluxcdbot
      messageTemplate: |
        Automated image update

        {{ range $resource, $changes := .Changed.Objects -}}
        - {{ $resource.Kind }}/{{ $resource.Name }}: {{ range $change := $changes }}{{ $change.OldValue }} -> {{ $change.NewValue }}{{ end }}
        {{ end -}}
    push:
      branch: staging
  update:
    path: ./apps
    strategy: Setters
```

### Webhook Receiver for Fast Reconciliation

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: dockerhub
  namespace: flux-system
spec:
  type: dockerhub
  secretRef:
    name: webhook-token
  resources:
    - kind: ImageRepository
      name: imdbgraph
    - kind: ImageRepository
      name: dota-visualizer
    - kind: ImageRepository
      name: pc-tune-ups
    - kind: ImageRepository
      name: portfolio
```

Get webhook URL:

```sh
kubectl -n flux-system get receiver/dockerhub
# URL: /hook/<hash>
```

### Files to Create/Modify

| Action | File                                                                    |
| ------ | ----------------------------------------------------------------------- |
| Modify | `.github/workflows/ci.yml` - add docker-build job                       |
| Create | `packages/infra/manifests/gitops/image-automation/imdbgraph.yaml`       |
| Create | `packages/infra/manifests/gitops/image-automation/dota-visualizer.yaml` |
| Create | `packages/infra/manifests/gitops/image-automation/pc-tune-ups.yaml`     |
| Create | `packages/infra/manifests/gitops/image-automation/portfolio.yaml`       |
| Create | `packages/infra/manifests/gitops/image-automation/image-update.yaml`    |
| Create | `packages/infra/manifests/gitops/image-automation/receiver.yaml`        |
| Modify | `apps/imdbgraph/k8s/kustomization.yaml` - add image policy marker       |
| Modify | `apps/dota-visualizer/k8s/kustomization.yaml` - add image policy marker |
| Modify | `apps/pc-tune-ups/k8s/kustomization.yaml` - add image policy marker     |
| Modify | `apps/portfolio/k8s/kustomization.yaml` - add image policy marker       |
| Modify | `packages/infra/manifests/gitops/sync.yaml` - add image-automation path |

### Secrets Required

| Secret            | Location          | Purpose                         |
| ----------------- | ----------------- | ------------------------------- |
| `DOCKER_USERNAME` | GitHub Secrets    | Docker Hub login                |
| `DOCKER_PASSWORD` | GitHub Secrets    | Docker Hub access token (write) |
| `webhook-token`   | Kubernetes Secret | Flux Receiver authentication    |

Create webhook token secret:

```sh
TOKEN=$(head -c 12 /dev/urandom | shasum | cut -d ' ' -f1)
kubectl -n flux-system create secret generic webhook-token --from-literal=token=$TOKEN
```

### CI Workflow: Docker Build Stage

```yaml
docker-build:
  needs: [quality-checks, find-apps]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  strategy:
    matrix:
      app: ${{ fromJson(needs.find-apps.outputs.apps) }}
  steps:
    - uses: actions/checkout@v4
    - uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    - uses: docker/setup-buildx-action@v3
    - uses: docker/build-push-action@v6
      with:
        context: .
        build-args: APP_NAME=${{ matrix.app }}
        tags: docker.io/aamini/${{ matrix.app }}:sha-${{ github.sha }}
        push: true
        cache-from: type=gha
        cache-to: type=gha,mode=max

notify-flux:
  needs: [docker-build]
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Flux webhook
      run: curl -X POST ${{ secrets.FLUX_WEBHOOK_URL }}
```

### Incident Management

**Suspend automation:**

```sh
flux suspend image update flux-system
```

**Resume:**

```sh
flux resume image update flux-system
```

**Suspend specific app scanning:**

```sh
flux suspend image repository imdbgraph
```

### Test Scenario

1. Push to main
2. Verify Docker image pushed: `docker pull docker.io/aamini/imdbgraph:sha-abc1234`
3. Verify Flux detected: `flux get image repository imdbgraph`
4. Verify policy selected: `flux get image policy imdbgraph`
5. Verify commit pushed to staging: `git log staging`
6. Verify pod rolled out: `kubectl get pods -n imdbgraph`
