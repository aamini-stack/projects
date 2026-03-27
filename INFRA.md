# Infra E2E Deployment + Recovery Plan

## Goal

Validate that `infra/src/bootstrap.ts` can run a full end-to-end lifecycle cleanly across:

- `organization/global`
- `landing-zone/staging` and `landing-zone/production`
- `platform/staging` and `platform/production`

And prove we can recover quickly from unexpected failures (especially FluxCD teardown hangs in `infra/src/platform/src/kubernetes.ts`).

## Success Criteria

1. A full `up` run completes without manual intervention.
2. A full `destroy` run completes without hanging.
3. At least 3 failure modes are exercised and recovered from with a documented procedure:
   - interrupted run (Ctrl+C / terminal close)
   - expired AWS SSO token
   - FluxCD resources stuck during delete
4. Re-running the same command after a failure is safe (idempotent behavior).

## Preflight (before any live run)

Run from `infra/`:

```bash
pnpm bootstrap -- up --check --profile <management-profile>
pnpm bootstrap -- up --preview --profile <management-profile>
```

Validate:

- Caller is not root and is in management account.
- Organization accounts resolve correctly.
- Identity Center groups resolve/create as expected.
- Execution order is correct.
- Required secrets are set (`GITHUB_TOKEN`, `POSTGRES_ADMIN_PASSWORD`, Cloudflare auth if needed).

## Execution Plan

### Phase 1: Controlled apply

1. Deploy all stacks:

   ```bash
   pnpm bootstrap -- up --profile <management-profile>
   ```

2. Smoke check outputs/resources:
   - EKS clusters exist in staging + production.
   - Flux namespace/components exist and become healthy.
   - IAM role `flux-ecr-readonly` exists.

3. Capture evidence/logs:
   - command output logs
   - `pulumi stack output` from platform stacks

### Phase 2: Failure injection + recovery drills

Run these drills one at a time and document outcomes.

#### Drill A: Interrupted deployment

1. Start full apply, interrupt mid-run.
2. Recover:

   ```bash
   pulumi cancel --yes --stack <org>/<stack>
   pnpm bootstrap -- up --profile <management-profile>
   ```

Expected: rerun converges without drift.

#### Drill B: Expired SSO token

1. Simulate expired login (or wait for expiry).
2. Run apply in normal mode and confirm auto-login path works.
3. Run with `--non-interactive` and confirm it fails fast with clear action message.

#### Drill C: Partial platform failure

1. Introduce a temporary bad config value (safe, reversible) for `platform` only.
2. Confirm failure is isolated and surfaces clearly.
3. Fix config and rerun full `up`.

Expected: no manual state surgery needed.

### Phase 3: Full teardown

1. Destroy all stacks:

   ```bash
   pnpm bootstrap -- destroy --profile <management-profile>
   ```

2. Optional hard cleanup of stack objects:

   ```bash
   pnpm bootstrap -- destroy --profile <management-profile> --remove-stacks
   ```

3. Verify no orphaned resources remain in staging/production accounts.

## FluxCD Delete-Hang Runbook (Primary Risk)

If destroy appears stuck on Flux resources for more than ~20 minutes:

1. Confirm Pulumi update status and cancel if needed:

   ```bash
   pulumi cancel --yes --stack <org>/<platform-stack>
   ```

2. Manually uninstall Flux Helm releases:

   ```bash
   helm uninstall flux-instance -n flux-system || true
   helm uninstall flux-operator -n flux-system || true
   ```

3. Delete Flux namespace and remove finalizers if needed:

   ```bash
   kubectl delete ns flux-system --wait=false || true
   kubectl get ns flux-system -o json | jq '.spec.finalizers=[]' | kubectl replace --raw /api/v1/namespaces/flux-system/finalize -f - || true
   ```

4. Re-run destroy:

   ```bash
   pnpm bootstrap -- destroy --project platform --environment <staging|production> --profile <management-profile>
   ```

5. Last resort (only if resource is already gone in AWS/K8s but Pulumi state is stuck):
   - backup stack state (`pulumi stack export > backup.json`)
   - remove only the orphaned URN from state
   - rerun destroy

## Reliability Improvements to Implement Next

1. Add retry/backoff around `stack.up()` and `stack.destroy()` in `bootstrap.ts` for transient cloud API failures.
2. Add per-stack timeout and clearer phase logging (start/end timestamps).
3. Add `--project platform --environment <env>` specific runbook scripts for faster recovery.
4. Add a pre-destroy step that explicitly tears down Flux first (Helm releases + namespace) before broader platform deletion.
5. Add a post-destroy verification script that checks EKS, IAM roles, and lingering `flux-system` artifacts.

## Test Log Template

For each run capture:

- Date/time
- Command executed
- Stacks touched
- Duration
- Result (pass/fail)
- Failure mode (if any)
- Recovery steps used
- Residual issues / follow-ups
