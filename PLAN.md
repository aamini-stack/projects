# AWS Organization Codification Plan

## Goal

Make Pulumi the source of truth for the AWS organization wherever AWS provides a
stable resource model.

We want code to manage:

- AWS Organizations topology
- OU hierarchy and account placement
- SCPs and attachments
- IAM Identity Center permission sets and assignments
- Control Tower account vending for new accounts
- per-account baseline resources
- platform infrastructure in staging and production

The AWS console should be used mainly for verification and break-glass recovery.

## Current State

Already in code:

- `infra/src/organization/index.ts`
  - Identity Center permission sets and assignments
  - Control Tower account vending inputs
- `infra/src/landing-zone/index.ts`
  - per-account baseline resources
  - budget alerts
  - CI/CD, audit, and break-glass roles
- `infra/src/platform/index.ts`
  - environment platform resources
- `infra/src/bootstrap.ts`
  - orchestration across stacks

Still missing:

- OU tree as managed state
- account parent/OU placement as managed state
- SCP definitions and attachments
- Control Tower OU governance state
- import/adoption workflow for existing org resources
- explicit topology config model

Important notes:

- `infra/src/bootstrap.ts` currently discovers accounts by name and assumes they
  already exist.
- The desired OU name is `Staging`.
- `landing-zone` should be renamed to `account-baseline` to better match what
  that stack actually does.

## Principles

1. Accounts are the primary isolation boundary.
2. Importing existing resources still counts as codified.
3. Keep Organizations, Control Tower, access, and baseline/platform concerns
   separate.
4. Favor explicit, boring topology over clever automation.
5. Make risky org changes one step at a time.

## Target Topology

OU hierarchy:

- `Root`
- `Core`
- `Workloads`
- `Workloads/Production`
- `Staging`

Account placement:

- management account stays as the Control Tower management account
- staging account moves under `Staging`
- production account moves under `Workloads/Production`

Access model:

- `Admins`: admin in staging and production
- `Developers`: write access in staging, no standing production write
- `ReadOnly`: read-only in production
- `BreakGlassRole`: emergency elevation path with MFA

## What We Will Codify

### 1. Organizations Topology

Manage:

- org root discovery
- OU creation and import
- account placement
- topology outputs for downstream stacks

Use Pulumi resources such as:

- `aws.organizations.Organization`
- `aws.organizations.OrganizationalUnit`
- `aws.organizations.Account`

Rules:

- import existing staging and production accounts
- do not recreate live accounts
- manage the desired OU topology with `Staging`

### 2. SCPs

Manage:

- SCP documents
- policy attachments
- policy type enablement if needed

Start with a small set of policies, likely:

- staging guardrails
- minimal production guardrails

Roll out gradually, starting with staging.

### 3. Control Tower

Use Control Tower for new accounts only.

- existing accounts: import/adopt
- future accounts: create through Account Factory from code

Keep OU governance and optional controls in a dedicated layer so it can evolve
separately from raw Organizations topology.

### 4. Identity Center Access

Keep extending the codification already in `infra/src/organization/index.ts`:

- permission sets
- group-to-account assignments
- environment-specific defaults

### 5. Account Baseline and Platform

Continue managing:

- per-account baseline resources
- shared platform resources

Planned rename:

- rename `landing-zone` to `account-baseline`
- update bootstrap and documentation to use the new name
- treat this as a naming cleanup, not a behavior change

## Migration Plan

### Phase 0: Inventory Live State

Collect:

- root ID
- all OUs and parent IDs
- all accounts and current parents
- existing SCPs and attachments
- Control Tower governed OUs, baselines, and controls
- staging account details and current placement

Deliverable:

- a typed inventory/config source for imports and validation

### Phase 1: Add a Topology Model

Build a typed desired-state model in the `organization` stack for:

- OU tree
- existing accounts
- future requested accounts
- optional SCP attachments

Deliverables:

- topology schema
- stable logical names
- exported OU/account maps

### Phase 2: Import Existing Resources

Adopt existing live resources before making structural changes.

Import:

- surviving OUs
- staging account
- production account
- existing SCPs and attachments

Rule:

- imported accounts must start with their current live `parentId`

The first preview should be a no-op or near-no-op.

### Phase 3: Rename `landing-zone` to `account-baseline`

Rename the stack/module to match its role as the per-account baseline layer.

Expected changes:

- rename `infra/src/landing-zone` to `infra/src/account-baseline`
- update `infra/src/bootstrap.ts`
- update docs and references

Do this as a controlled refactor before adding more scope to that layer.

### Phase 4: Adopt `Staging` as the Desired OU

After imports and the rename are stable:

- define `Staging` in code
- align the staging account with `Staging`
- export its identifiers
- attach intended SCPs later if needed

Use `Staging` as the desired OU going forward.

### Phase 5: Intentionally Reparent Accounts

Move accounts only after topology is stable:

- staging to `Staging`
- production to `Workloads/Production`

Rules:

- one move at a time
- preview before apply
- do not combine moves with SCP hardening

### Phase 6: Codify SCPs

After accounts are in the right OUs:

- create minimal v1 SCPs
- attach to staging first
- validate access
- roll out production guardrails carefully

### Phase 7: Add Control Tower OU Governance

Once Organizations topology is stable:

- register/govern required OUs
- add optional controls later
- keep this separate from OU/account placement logic

### Phase 8: Keep Future Accounts Declarative

For future accounts:

- define them in organization config
- create them through Control Tower
- place them in the intended OU
- baseline them through `account-baseline`
- deploy platform resources as needed

## Code Shape

Current stacks:

- `infra/src/organization`
- `infra/src/landing-zone` -> planned rename to `infra/src/account-baseline`
- `infra/src/platform`

Recommended near-term structure:

- keep a single `organization` stack
- add internal modules for topology, SCPs, identity, and account factory
- keep `account-baseline` and `platform` as separate stacks

## Bootstrap Changes

`infra/src/bootstrap.ts` should evolve to:

- consume explicit topology outputs
- validate expected accounts and OUs
- stop relying on name lookups as the source of truth
- orchestrate stacks without becoming the system of record

## Safety Rules

- never mix adoption and refactoring in one apply
- perform one risky org mutation per apply
- test risky governance changes in staging first
- keep production SCPs minimal at first
- preserve documented break-glass access

## Manual vs Automated Boundary

Fully codify:

- OU hierarchy
- account placement
- SCPs and attachments
- Identity Center access
- new account requests
- account baseline resources
- platform resources

Expect some operational friction around:

- Control Tower OU registration or re-registration
- Control Tower landing zone upgrades or resets
- recovery from partially failed Control Tower workflows

## Success Criteria

This plan is done when:

- the OU tree is defined in code
- staging and production accounts are under Pulumi ownership
- `Staging` is managed by Pulumi as part of the OU topology
- account placement is declarative
- SCPs are defined and attached from code
- future accounts are vended through Control Tower from code
- `account-baseline` and `platform` consume declared org topology
- console changes are the exception, not the default

## Recommended Execution Order

1. inventory live org state
2. add topology model
3. import surviving OUs, accounts, and SCPs
4. run a no-op preview
5. rename `landing-zone` to `account-baseline`
6. adopt `Staging` as the desired OU shape
7. move accounts only if needed
8. attach staging SCPs
9. attach production SCPs carefully
10. add Control Tower OU governance
11. update bootstrap to consume topology outputs

## Final Position

Codify everything that is stable, import what already exists, avoid unnecessary
recreation, and isolate the awkward Control Tower workflows behind explicit
steps.
