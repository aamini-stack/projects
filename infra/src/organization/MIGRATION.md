# Organization Guardrails Migration

This refactor moves the old `account-baseline` resources for staging and
production into `organization/global`.

The old `infra/src/account-baseline/` project files remain in the repo on
purpose until the state migration is complete and verified.

## Expected Target Shape

- `organization/global` owns org structure, identity, account vending, and both
  workload-account guardrails.
- `platform/staging` and `platform/production` remain separate runtime stacks.
- `account-baseline/*` should stop being part of the bootstrap execution plan.

## Resource Mapping

Old stack resources are now declared from `organization/global` with new logical
names and aliases back to the old stack/project URNs.

- `budget-alerts` -> `guardrails-<env>-budget-alerts`
- `budget-alerts-email` -> `guardrails-<env>-budget-alerts-email`
- `monthly-cost-budget` -> `guardrails-<env>-monthly-cost-budget`
- `platform-events` -> `guardrails-<env>-platform-events`
- `billing-alarm` -> `guardrails-<env>-billing-alarm`
- `cicd-deploy-role` -> `guardrails-<env>-cicd-deploy-role`
- `cicd-admin-access` -> `guardrails-<env>-cicd-admin-access`
- `readonly-audit-role` -> `guardrails-<env>-readonly-audit-role`
- `readonly-audit-access` -> `guardrails-<env>-readonly-audit-access`
- `breakglass-role` -> `guardrails-<env>-breakglass-role`
- `breakglass-admin-access` -> `guardrails-<env>-breakglass-admin-access`

`<env>` is `staging` or `production`.

## Recommended Migration Flow

1. Export backups first:
   - `pulumi stack export --stack <org>/staging --cwd infra/src/account-baseline > account-baseline-staging.json`
   - `pulumi stack export --stack <org>/production --cwd infra/src/account-baseline > account-baseline-production.json`
   - `pulumi stack export --stack <org>/global --cwd infra/src/organization > organization-global.before.json`
2. Migrate staging guardrails first with `pulumi state move` from the old stack
   into `organization/global`.
3. Run a preview on `organization/global` and confirm the staging guardrails are
   retained instead of recreated.
4. Repeat the same move and preview flow for production.
5. Only after both previews are clean should you retire the old
   `account-baseline` stack/project shell.

## State Move Commands

First list URNs in the source stack so you can move the exact guardrail
resources:

```bash
pulumi stack --stack <org>/staging --cwd infra/src/account-baseline --show-urns
pulumi stack --stack <org>/production --cwd infra/src/account-baseline --show-urns
```

Then move the old guardrail URNs into `organization/global` one environment at a
time:

```bash
pulumi state move \
  --source <org>/staging \
  --dest <org>/global \
  '<staging guardrail urn 1>' \
  '<staging guardrail urn 2>'
```

```bash
pulumi state move \
  --source <org>/production \
  --dest <org>/global \
  '<production guardrail urn 1>' \
  '<production guardrail urn 2>'
```

Move the full guardrail set for each environment:

- SNS topic and optional email subscription
- monthly budget
- billing alarm
- platform log group
- bootstrap IAM roles and their policy attachments

## Preview Checks

After each move, run:

```bash
pulumi preview --stack <org>/global --cwd infra/src/organization
```

What you want to see:

- aliases/adoption of the moved guardrail resources
- no replacement of budgets, SNS topics, log groups, or IAM roles
- only intentional drift such as tag updates if you accept the new
  `Scope=guardrails` tagging

If preview is not effectively no-op for a migrated environment, stop and fix the
URN move/import mapping before touching the next environment.
