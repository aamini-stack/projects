# CI/CD Simplification Plan: Repository Dispatch Approach

## Overview

Replace polling-based E2E tests with an event-driven architecture using GitHub's `repository_dispatch` webhook. This eliminates the reliability issues of polling while maintaining a clean separation between build/deploy and E2E testing phases.

## Current State

The CI currently has a monolithic workflow (`ci.yml`) that:
1. Runs quality checks and tests in parallel
2. Builds and pushes Docker images
3. Deploys via Flux GitOps
4. **Polls** for deployment readiness
5. Runs E2E tests inline

**Problems with current approach:**
- Polling is unreliable (may test against old deployment)
- Wastes compute resources
- Tightly couples build/deploy with E2E testing
- Hard to see the full deployment pipeline in GitHub UI

## Proposed Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   CI Push   │────▶│  Quality    │────▶│  Integration    │
│   (PR/Main) │     │   Checks    │     │     Tests       │
└─────────────┘     └─────────────┘     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │  Build & Push   │
                                        │  Docker Images  │
                                        └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │ Deploy GitOps   │
                                        │  (Flux Apply)   │
                                        │ + Create GitHub │
                                        │   Deployment    │
                                        └─────────────────┘
                                                │
                                                │ Flux reconciles
                                                ▼
                                        ┌─────────────────┐
                                        │  Flux Webhook   │
                                        │  (notification  │
                                        │   controller)   │
                                        └─────────────────┘
                                                │
                                                │ POST to GitHub API
                                                ▼
                                        ┌─────────────────┐
                                        │  Repository     │
                                        │   Dispatch      │
                                        │  (e2e-deployed) │
                                        └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │  E2E Workflow   │
                                        │  (separate job) │
                                        └─────────────────┘
```

## Benefits

1. **Reliable**: E2E runs only when deployment is confirmed ready
2. **Efficient**: No wasted polling compute
3. **Clear separation**: Build/deploy vs E2E are distinct workflows
4. **Better visibility**: See deployment and E2E as separate checks in PR
5. **Scalable**: Easy to add more post-deployment hooks later

## Implementation Steps

### Step 1: Update `ci.yml` - Remove Polling, Add Deployment Creation

**File:** `.github/workflows/ci.yml`

**Changes:**

1. Remove the polling E2E step:
```yaml
# REMOVE this entire step:
# - name: Run e2e tests
#   if: steps.changed.outputs.changed == 'true'
#   env:
#     PR_NUMBER: ${{ github.event.pull_request.number }}
#   run: |
#     if [[ "${{ github.event_name }}" == "pull_request" ]]; then
#       ./scripts/bin/aamini e2e run ${{ matrix.app }} \
#         --preview "$PR_NUMBER" \
#         --wait
#     else
#       ./scripts/bin/aamini e2e run ${{ matrix.app }} \
#         --production \
#         --wait
#     fi
```

2. Add GitHub Deployment creation after deploy:
```yaml
- name: Create GitHub Deployment
  if: steps.changed.outputs.changed == 'true'
  env:
    GH_TOKEN: ${{ secrets.FLUX_GITHUB_TOKEN }}
    IMAGE_TAG: ${{ steps.image-tag.outputs.value }}
  run: |
    if [[ "${{ github.event_name }}" == "pull_request" ]]; then
      ENV_NAME="${{ matrix.app }}-preview"
      PAYLOAD="{\"app\":\"${{ matrix.app }}\",\"image_tag\":\"$IMAGE_TAG\",\"pr_number\":\"${{ github.event.pull_request.number }}\",\"environment\":\"preview\"}"
    else
      ENV_NAME="${{ matrix.app }}-production"
      PAYLOAD="{\"app\":\"${{ matrix.app }}\",\"image_tag\":\"$IMAGE_TAG\",\"environment\":\"production\"}"
    fi
    
    gh api repos/${{ github.repository }}/deployments \
      -f ref="${{ github.sha }}" \
      -f environment="$ENV_NAME" \
      -f auto_merge=false \
      -f required_contexts[]= \
      -f payload="$PAYLOAD"
```

### Step 2: Create Flux Notification Manifests

**File:** `k8s/flux/github-notifications.yaml` (or wherever you keep Flux manifests)

```yaml
---
# Provider for sending webhooks to GitHub
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: github-dispatch
  namespace: flux-system
spec:
  type: generic
  # GitHub API endpoint for repository_dispatch
  address: https://api.github.com/repos/aamini-stack/aamini-stack/dispatches
  secretRef:
    name: github-token
---
# Alert that triggers on Kustomization success
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: trigger-e2e-on-deploy
  namespace: flux-system
spec:
  providerRef:
    name: github-dispatch
  # Only trigger on successful reconciliations
  eventSeverity: info
  eventSources:
    - kind: Kustomization
      name: portfolio-preview
      namespace: flux-system
    - kind: Kustomization
      name: portfolio-production
      namespace: flux-system
  # Only match "succeeded" events
  inclusionList:
    - ".*succeeded.*"
  # Pass through metadata
  eventMetadata:
    event_type: "e2e-deployed"
```

**File:** `k8s/flux/github-token-secret.yaml` (template)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: github-token
  namespace: flux-system
type: Opaque
stringData:
  # GitHub PAT with repo scope
  token: <GITHUB_PAT_WITH_REPO_SCOPE>
```

### Step 3: Update `e2e-on-deploy-ready.yml`

**File:** `.github/workflows/e2e-on-deploy-ready.yml`

**Changes:**

1. Replace the trigger events:
```yaml
# REMOVE:
# on:
#   deployment_status:

# REPLACE WITH:
on:
  repository_dispatch:
    types: [e2e-deployed]
  workflow_dispatch:
    inputs:
      # Keep existing inputs for manual runs
      app:
        description: App to test
        required: true
        type: choice
        options:
          - dota-visualizer
          - imdbgraph
          - pc-tune-ups
          - portfolio
      environment:
        description: Deployment environment
        required: true
        default: stable
        type: choice
        options:
          - stable
          - preview
      url:
        description: Public URL to test
        required: true
        type: string
      sha:
        description: Deployed git SHA
        required: true
        type: string
      pr_number:
        description: Pull request number for previews
        required: false
        type: string
      image_tag:
        description: Deployed image tag
        required: false
        type: string
```

2. Update the payload normalization step to handle repository_dispatch:
```yaml
- name: Normalize deploy-ready payload
  id: payload
  run: |
    if [[ "${{ github.event_name }}" == "repository_dispatch" ]]; then
      # Extract from repository_dispatch payload
      echo "app=${{ github.event.client_payload.app }}" >> "$GITHUB_OUTPUT"
      echo "sha=${{ github.event.client_payload.sha }}" >> "$GITHUB_OUTPUT"
      echo "url=${{ github.event.client_payload.url }}" >> "$GITHUB_OUTPUT"
      echo "pr_number=${{ github.event.client_payload.pr_number }}" >> "$GITHUB_OUTPUT"
      echo "image_tag=${{ github.event.client_payload.image_tag }}" >> "$GITHUB_OUTPUT"
      echo "environment=${{ github.event.client_payload.environment }}" >> "$GITHUB_OUTPUT"
    else
      # Manual dispatch - use inputs
      echo "app=${{ github.event.inputs.app }}" >> "$GITHUB_OUTPUT"
      echo "sha=${{ github.event.inputs.sha }}" >> "$GITHUB_OUTPUT"
      echo "url=${{ github.event.inputs.url }}" >> "$GITHUB_OUTPUT"
      echo "pr_number=${{ github.event.inputs.pr_number }}" >> "$GITHUB_OUTPUT"
      echo "image_tag=${{ github.event.inputs.image_tag }}" >> "$GITHUB_OUTPUT"
      echo "environment=${{ github.event.inputs.environment }}" >> "$GITHUB_OUTPUT"
    fi
```

3. Remove the `deployment_status` conditional:
```yaml
# REMOVE this condition:
# if:
#   ${{ github.event_name != 'deployment_status' ||
#   github.event.deployment_status.state == 'success' }}
```

4. Update commit status marking to reference correct source:
```yaml
# Update the SOURCE env var in both commit status steps:
- name: Mark e2e pending
  env:
    SOURCE: "e2e-deployed"  # Changed from github.event.deployment_status.creator.login
    # ... rest of env vars

- name: Update commit statuses
  env:
    SOURCE: "e2e-deployed"  # Changed from github.event.deployment_status.creator.login
    # ... rest of env vars
```

### Step 4: Create Intermediate Webhook Service (Optional but Recommended)

**Problem:** Flux's generic webhook sends the event payload in a specific format that doesn't match what we need for the E2E workflow.

**Solution:** Create a simple Cloudflare Worker/AWS Lambda to transform the payload.

**File:** `services/webhook-transformer/index.js`

```javascript
/**
 * Webhook Transformer
 * Receives Flux notification and triggers GitHub repository_dispatch
 */

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const fluxEvent = await request.json();
    
    // Extract info from Flux event
    const metadata = fluxEvent.metadata || {};
    const revision = metadata['kustomize.toolkit.fluxcd.io/revision'] || '';
    const sha = revision.split('/')[1] || revision; // "main/abc123" -> "abc123"
    
    // Parse payload from deployment (if available)
    const deploymentPayload = metadata['deployment.payload'] || {};
    const app = deploymentPayload.app || extractAppFromKustomization(fluxEvent.involvedObject?.name);
    const prNumber = deploymentPayload.pr_number;
    const environment = deploymentPayload.environment || 'production';
    
    // Build URL based on environment
    const url = buildUrl(app, prNumber, environment);
    
    // Trigger GitHub repository_dispatch
    const githubResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'e2e-deployed',
          client_payload: {
            app,
            sha,
            url,
            pr_number: prNumber,
            image_tag: deploymentPayload.image_tag,
            environment,
            flux_event: {
              kustomization: fluxEvent.involvedObject?.name,
              namespace: fluxEvent.involvedObject?.namespace,
              timestamp: fluxEvent.timestamp,
            }
          }
        })
      }
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      console.error('GitHub API error:', error);
      return new Response(`GitHub API error: ${error}`, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  }
};

function extractAppFromKustomization(name) {
  // Extract app name from kustomization name like "portfolio-preview"
  return name?.replace(/-(preview|production)$/, '') || 'unknown';
}

function buildUrl(app, prNumber, environment) {
  const domain = environment === 'preview' 
    ? `pr-${prNumber}.preview.aamini-stack.com`
    : `${app}.aamini-stack.com`;
  return `https://${domain}`;
}
```

**If using the transformer, update Flux Provider:**
```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: webhook-transformer
  namespace: flux-system
spec:
  type: generic
  # Point to your transformer service
  address: https://your-worker.your-subdomain.workers.dev
  secretRef:
    name: transformer-secret
```

### Step 5: Add Branch Protection Integration

To make the E2E tests block PR merges:

1. Go to **Settings > Branches > Branch protection rules**
2. Edit your `main` branch rule
3. Enable **"Require deployments to succeed before merging"**
4. Select the environments: `portfolio-preview`, `portfolio-production`, etc.

**Note:** Since we're using repository_dispatch, you'll also need to ensure the E2E workflow sets a commit status. The workflow already does this via `e2e-commit-status.ts`.

### Step 6: Clean Up

**Remove deprecated files:**
- `.github/workflows/deployment-gate.yml` (if no longer needed)
- Any polling-related scripts in `./scripts/bin/aamini`

**Update documentation:**
- Update any README or docs that reference the polling approach
- Document the new event-driven architecture

## Testing Plan

### Test 1: Verify CI Creates Deployment
1. Create a test PR
2. Verify CI runs quality checks, integration tests, build, push, deploy
3. Verify GitHub Deployment is created (check PR "Deployments" section)
4. Verify deployment is in "pending" state

### Test 2: Verify Flux Notification
1. Check Flux notification-controller logs:
   ```bash
   kubectl logs -n flux-system deployment/notification-controller
   ```
2. Verify webhook is sent when Kustomization succeeds

### Test 3: Verify Repository Dispatch
1. Check GitHub Actions tab for `e2e-on-deploy-ready.yml` runs
2. Verify it triggered with correct payload
3. Check E2E tests run and complete

### Test 4: Verify PR Blocking
1. Ensure E2E workflow sets commit status
2. Verify PR cannot be merged until E2E passes
3. Test failure case: break E2E test, verify PR is blocked

### Test 5: Manual Dispatch
1. Test manual workflow dispatch from Actions tab
2. Verify E2E runs with provided inputs

## Rollback Plan

If issues arise:

1. **Revert CI changes:** Restore polling E2E step in `ci.yml`
2. **Disable Flux notifications:** `kubectl delete alert trigger-e2e-on-deploy -n flux-system`
3. **Remove branch protection:** Disable deployment requirements temporarily
4. **Update e2e workflow:** Restore `deployment_status` trigger alongside `repository_dispatch`

## Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **1. Preparation** | Create GitHub PAT, set secrets, create Flux manifests | 30 min |
| **2. CI Updates** | Modify ci.yml, test in PR | 1 hour |
| **3. Flux Setup** | Apply notification manifests, verify webhooks | 1 hour |
| **4. E2E Updates** | Update e2e workflow, test triggers | 1 hour |
| **5. Integration** | Test full flow, verify PR blocking | 2 hours |
| **6. Cleanup** | Remove old polling code, update docs | 30 min |

**Total: ~6 hours of focused work**

## Questions to Resolve

1. **Webhook Transformer:** Do you want to build the transformer service, or can we simplify by having Flux call GitHub directly with a simpler payload?

2. **URL Discovery:** How does the E2E workflow know the deployment URL? Options:
   - Hardcode convention (e.g., `pr-{number}.preview.aamini-stack.com`)
   - Query Kubernetes for the Ingress/Service
   - Pass via GitHub Deployment payload and have transformer extract it

3. **Secret Management:** Where should `GITHUB_TOKEN` be stored?
   - GitHub repository secret (for CI to create deployments)
   - Kubernetes secret (for Flux to send webhooks)
   - Both

## Next Steps

1. Review this plan
2. Decide on webhook transformer approach
3. Create GitHub PAT with appropriate scopes
4. Set up secrets in both GitHub and Kubernetes
5. Apply changes in order (CI → Flux → E2E)
6. Test end-to-end
