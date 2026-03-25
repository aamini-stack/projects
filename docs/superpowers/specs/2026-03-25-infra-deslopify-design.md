# Infra Deslopify Design

## Goal

Simplify the infra architecture by collapsing the standalone `account-baseline`
 Pulumi project into the `organization` stack while preserving `platform` as a
 separate deployable unit.

The refactor should reduce orchestration/configuration slop, make the stack
 boundaries easier to understand, and keep the mental model small:

- `organization` owns account setup and governance
- `platform` owns workload/runtime infrastructure inside workload accounts
- `guardrails` becomes an internal concept/module, not its own Pulumi project

## Current State

### Deployable projects

- `organization`
  - AWS Organizations topology
  - IAM Identity Center permission sets and assignments
  - account vending for requested accounts
  - imported account/policy handling
- `account-baseline`
  - per-account budgets and billing alarms
  - SNS alerting topic/subscription
  - per-account CloudWatch log group for platform events
  - bootstrap IAM roles like `CICDDeployRole`, `ReadOnlyAuditRole`, and
    `BreakGlassRole`
  - exported provider/bootstrap values consumed as account-local setup outputs
- `platform`
  - EKS, Flux, ECR, Postgres, Cloudflare
  - runtime/shared environment infrastructure inside workload accounts

### Main problems

- `infra/src/bootstrap.ts` has absorbed too much business logic:
  discovery, identity/group creation, account selection, config assembly,
  execution ordering, retries, timeout handling, and destroy cleanup.
- The `account-baseline` project is too small and too coupled to foundational
  org/account setup to justify a separate project boundary.
- The architecture has a reasonable high-level split, but the implementation
  makes it feel more complex than it really is.
- Naming is muddy: `account-baseline` is both generic and weaker than the job it
  actually performs.

## Decision

Adopt a two-project model:

- `organization`
- `platform`

Rename the internal concept currently called `account-baseline` to
`guardrails` and move it into the `organization` stack as an internal module or
component.

## Approaches Considered

### 1. Collapse to two projects (chosen)

Keep `organization` and `platform`, and move `account-baseline` into
`organization`.

Pros:

- removes the least valuable deployable boundary
- reduces execution plan/config file sprawl
- aligns all foundation-layer concerns into one stack
- keeps `platform` separate, which still has a distinct lifecycle and blast
  radius

Cons:

- `organization` becomes broader
- previews/updates for foundation changes cover more resources at once

### 2. Keep three projects but refactor orchestration

Retain `account-baseline` as a separate stack and clean up `bootstrap.ts`.

Pros:

- strongest state isolation
- lowest migration risk

Cons:

- preserves the boundary the user already dislikes
- likely still feels over-engineered even after cleanup

### 3. Redesign around account-centric stacks

Use one management/foundation stack plus separate per-account stacks that own
baseline and platform concerns together.

Pros:

- strong ownership model long term
- clean account-oriented mental model

Cons:

- larger redesign than needed right now
- higher migration and operational complexity

## Target Architecture

### Stack boundaries

#### `organization`

Owns foundational control-plane concerns:

- AWS Organizations topology and OU structure
- SCP import/attachment management
- IAM Identity Center permission sets and assignments
- requested account creation/import handling
- per-account guardrails for staging and production

#### `platform`

Owns runtime/workload concerns inside selected workload accounts:

- EKS and Flux
- ECR repositories
- Postgres
- Cloudflare and related runtime integration

### Internal capability naming

Rename `account-baseline` to `guardrails`.

This is an internal capability name, not a new deployable stack name.

Resulting model:

- `organization` stack
- `guardrails` module inside `organization`
- `platform` stack

## Code Structure Design

### `organization` composition root

`infra/src/organization/index.ts` should become a thin composition root that:

- loads normalized config
- creates the management-account provider
- creates per-account assumed-role providers for staging and production
- composes topology, identity, account vending, and guardrails
- exports concise stack outputs

It should not hold all detailed resource declarations inline once the refactor is
 complete.

### New `guardrails` module

Add a reusable module/component under `organization`, for example:

- `infra/src/organization/src/guardrails.ts`

Possible public API:

- `createAccountGuardrails(...)`
- `createGuardrailsForAccount(...)`

This module owns the logic currently implemented in
`infra/src/account-baseline/index.ts`, including:

- budget topic/subscription
- monthly budget
- billing alarm
- platform log group
- bootstrap IAM roles and policy attachments

The module should be reusable for both staging and production accounts.

Provider model:

- `organization` continues to use a management-account provider for org-wide
  resources like AWS Organizations and IAM Identity Center
- `guardrails` creates account-local resources by receiving or constructing an
  assumed-role AWS provider per managed account
- the likely interface is a small account descriptor that includes
  `accountId`, `environment`, `assumeRoleName`, and an account-scoped provider

### Config shape

`infra/src/organization/src/config.ts` should evolve from a flat config bag into
 a grouped model with explicit domains such as:

- `organization`
- `identity`
- `accounts`
- `guardrails`
- `imports`

Pulumi config keys should remain under the `organization:*` stack namespace,
since `guardrails` is no longer a separate stack.

### `bootstrap.ts`

`infra/src/bootstrap.ts` should be reduced to orchestration concerns only.

Target responsibilities:

- preflight/auth/discovery
- inventory loading and account selection
- config assembly for each deployable stack
- execution planning and invocation

Responsibilities that should become smaller helpers/modules over time:

- AWS discovery helpers
- organization config builder
- platform config builder
- stack execution engine
- destroy cleanup helpers

The execution plan should shrink to:

- `organization/global`
- `platform/staging`
- `platform/production`

## Boundaries and Responsibilities

### What belongs in `organization`

Put a concern in `organization` if it answers one of these questions:

- how is the org structured?
- who can access which account?
- what protections/bootstrap roles must every managed account have?
- how are new accounts created and brought under management?

### What belongs in `platform`

Put a concern in `platform` if it answers one of these questions:

- what shared runtime services exist in staging/production?
- how do workloads run or deploy?
- what cluster/database/repository/DNS primitives exist for apps?

This keeps governance/setup separate from runtime operations without over-slicing
 foundational code into extra projects.

## Operational Model Changes

Moving guardrails into `organization/global` changes the operational boundary.

What changes:

- there is no longer a standalone `account-baseline/staging` or
  `account-baseline/production` stack to target directly
- previews for foundation changes are centralized in `organization/global`
- destroy risk for foundation resources becomes concentrated in the global stack

How to keep this manageable:

- structure guardrails in code as two explicit account units, one for staging and
  one for production
- allow bootstrap/config assembly to support narrowing inputs during migration so
  previews can focus on one account's guardrails at a time when needed
- treat destroy on `organization/global` as a highly constrained/admin-only
  operation and avoid using it as a routine cleanup tool

Rollback expectation:

- until both account migrations are verified, keep the old account-baseline
  project files available in git history and preserve a documented state export
- if one account cannot be migrated safely, stop after the successful account,
  leave the other on the old stack temporarily, and revise the rollout rather
  than forcing a broad cutover

## Migration Plan

### Phase 1: prepare the new organization-owned guardrails shape

- move the logic from `infra/src/account-baseline/index.ts` into
  `infra/src/organization/src/guardrails.ts`
- keep resource names stable where possible
- instantiate guardrails for staging and production from
  `infra/src/organization/index.ts`
- ensure guardrails use per-account assumed-role providers inside the
  `organization/global` program

### Phase 2: migrate staging baseline state into `organization/global`

- target the staging account guardrails first
- import or state-move existing staging baseline resources from
  `account-baseline/staging` into `organization/global`
- preview until the migration is effectively no-op for the already-existing AWS
  resources
- verify no unintended replacement of budgets, SNS topics, log groups, or IAM
  roles

### Phase 3: migrate production baseline state into `organization/global`

- repeat the same process for `account-baseline/production`
- only continue once production also previews cleanly

### Phase 4: simplify orchestration

- remove `account-baseline` from the bootstrap execution plan
- remove account-baseline-specific config assembly in favor of organization-owned
  guardrails inputs
- reduce stack definitions from five logical entries to three

### Phase 5: remove old project shell

- delete `infra/src/account-baseline/Pulumi.yaml`
- delete `infra/src/account-baseline/Pulumi.*.yaml`
- delete now-unused references in scripts/docs

Do this only after state migration and preview verification are clean.

## State Migration Strategy

This refactor should preserve existing AWS resources rather than recreate them.

Preferred strategy:

- keep resource logical names stable where possible, but do not assume aliases
  alone solve the migration
- explicitly handle cross-stack migration from `account-baseline/staging` and
  `account-baseline/production` into `organization/global` with imports and/or
  state moves
- migrate one account at a time so preview noise and rollback scope stay small
- verify previews do not show destructive replacement of budgets, SNS topics, or
  IAM roles unless explicitly intended
- capture state backups/exports before each migration step

Non-goal:

- delete and recreate foundational resources just to make the code look cleaner

## Error Handling Design

- `bootstrap.ts` should fail early on auth, discovery, and inventory problems
- stack code should assume validated inputs and focus on declarative resource
  composition
- live AWS discovery inside stack programs should be minimized unless the stack
  truly owns that lookup

This keeps imperative orchestration logic out of the stack definitions as much as
 possible.

## Verification Strategy

After implementation:

- run `pnpm typecheck` in `infra`
- run targeted Pulumi previews for `organization/global`
- run targeted Pulumi previews for `platform/staging` and optionally
  `platform/production`
- confirm guardrail resources are retained and not unexpectedly replaced
- confirm bootstrap now operates over only the two intended projects

## Success Criteria

- infra has two deployable Pulumi projects instead of three
- `account-baseline` no longer exists as a standalone project
- `guardrails` exists as an internal organization capability/module
- `organization` clearly owns foundational setup/governance concerns
- `platform` clearly owns runtime/workload concerns
- `bootstrap.ts` is materially easier to understand and reason about
- previews show a safe migration path for existing resources

## Out of Scope

- redesigning the system into fully account-centric stacks
- changing the `platform` boundary beyond what is necessary for the new inputs
- unrelated refactors to runtime infrastructure resources
- broad stylistic rewrites that do not improve the selected architecture
