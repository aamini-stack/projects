# Infra Deslopify Design

## Goal

Reorganize `infra/src` so the Pulumi programs, operator-facing commands, and
shared support code have clear boundaries.

The intended result is:

- easier to navigate
- safer to extend
- less script sprawl at the top level of `infra/src`
- cleaner orchestration around `bootstrap`, GitOps rendering, and destroy
  verification

This design does not change the high-level deployable model. The Pulumi program
structure stays the same, with `organization` and `platform` remaining the two
program areas.

## Current State

Today `infra/src` mixes three different concerns at the same level:

- Pulumi programs: `organization/`, `platform/`
- command entrypoints: `bootstrap.ts`, `organization-inventory.ts`,
  `platform-recovery.ts`, `render.ts`, `verify-destroy.ts`
- reusable implementation details: `bootstrap/aws.ts`, `bootstrap/execution.ts`,
  `bootstrap/stacks.ts`, and helpers embedded inside one-off scripts

This creates a few recurring problems:

- `infra/src/bootstrap.ts` is too broad and acts as parser, resolver, planner,
  reporter, and executor
- `infra/src/render.ts` mixes domain modeling, manifest discovery, YAML
  generation, and filesystem rendering in one file
- `infra/src/verify-destroy.ts` duplicates AWS/process/temp-kubeconfig patterns
  instead of sharing infrastructure utilities
- top-level `infra/src` feels like both a programs directory and a scripts bin

## Decision

Adopt a three-zone structure under `infra/src`:

- `commands/` for thin executable entrypoints
- `lib/` for reusable orchestration and infrastructure helpers
- `programs/` for Pulumi programs

Target layout:

```text
infra/src/
  commands/
    bootstrap.ts
    render-gitops.ts
    verify-destroy.ts
    organization-inventory.ts
    platform-recovery.ts
  lib/
    aws/
    bootstrap/
    gitops/
    verification/
    process/
    temp/
  programs/
    organization/
    platform/
```

## Approaches Considered

### 1. Commands + domain libs + programs (chosen)

Move entrypoints into `commands/`, reusable logic into `lib/`, and Pulumi
programs into `programs/`.

Pros:

- creates clear boundaries without changing the deployment model
- makes top-level code easier to scan
- supports incremental refactoring instead of a big-bang rewrite
- gives `bootstrap`, `render`, and `verify-destroy` a natural home

Cons:

- requires some path churn
- temporarily adds wrapper files while code is being redistributed

### 2. Minimal split without a directory reshape

Keep the current top-level layout and only break large files into smaller ones.

Pros:

- lowest migration risk
- smallest path changes

Cons:

- preserves the messy mental model at `infra/src`
- scripts and Pulumi programs still appear intermingled

### 3. Unified CLI redesign

Build one root CLI with subcommands for bootstrap, render, verification, and
inventory.

Pros:

- best long-term command UX
- centralizes argument parsing and output conventions

Cons:

- larger redesign than needed right now
- couples structural cleanup with CLI product design

## Module Boundaries

### `programs/`

`infra/src/programs/organization` and `infra/src/programs/platform` contain only
Pulumi program code and closely related program-local modules.

Rules:

- these directories define infrastructure state
- they should not become general command utilities
- they can have local helper modules when those helpers are specific to the
  program

### `commands/`

`infra/src/commands/*` contains only operator-facing entrypoints.

Rules:

- parse args
- call a library orchestrator
- print user-facing output
- set exit code on failure

Each command should be thin. It should not contain the majority of the domain
logic.

### `lib/`

`infra/src/lib/*` contains reusable implementation code shared by commands and,
where appropriate, by programs.

Rules:

- no top-level CLI behavior
- no mixed concerns across parsing, domain logic, and filesystem/process access
- prefer focused modules with one clear job

## File Mapping

### Pulumi programs

- `infra/src/organization` -> `infra/src/programs/organization`
- `infra/src/platform` -> `infra/src/programs/platform`

The program structure stays the same as it is today; this is a relocation for
clarity, not a redesign of the program internals.

### Commands

- `infra/src/bootstrap.ts` -> `infra/src/commands/bootstrap.ts`
- `infra/src/render.ts` -> `infra/src/commands/render-gitops.ts`
- `infra/src/verify-destroy.ts` -> `infra/src/commands/verify-destroy.ts`
- `infra/src/organization-inventory.ts` ->
  `infra/src/commands/organization-inventory.ts`
- `infra/src/platform-recovery.ts` -> `infra/src/commands/platform-recovery.ts`

### Libraries

The current `infra/src/bootstrap/*` modules get redistributed according to what
they actually do:

- bootstrap-specific planning and orchestration stays under
  `infra/src/lib/bootstrap/*`
- bootstrap constants stay in `infra/src/lib/bootstrap/constants.ts`
- bootstrap-specific types stay in `infra/src/lib/bootstrap/types.ts`
- generic AWS helpers move to `infra/src/lib/aws/*`
- generic process execution moves to `infra/src/lib/process/*`
- temp kubeconfig and similar lifecycle helpers move to `infra/src/lib/temp/*`

## Bootstrap Design

`bootstrap` is the largest source of orchestration slop today, so it gets the
clearest internal pipeline.

Target files:

- `infra/src/lib/bootstrap/parse-cli.ts`
- `infra/src/lib/bootstrap/resolve-context.ts`
- `infra/src/lib/bootstrap/build-plan.ts`
- `infra/src/lib/bootstrap/print-plan.ts`
- `infra/src/lib/bootstrap/run-plan.ts`

### Responsibilities

#### `parse-cli.ts`

- parse raw argv
- validate CLI-level option shapes
- return a typed `BootstrapOptions`

#### `resolve-context.ts`

- resolve profile, region, org, caller identity
- load organization inventory
- resolve selected accounts
- resolve SSO groups and role assumptions
- compute defaults and generated values
- return a typed `BootstrapContext`

This is the place where imperative discovery belongs.

#### `build-plan.ts`

- convert `BootstrapContext` into stack definitions and execution plan
- apply project/environment filtering
- compute stack order for `up` vs `destroy`

This is the planning layer, not the execution layer.

#### `print-plan.ts`

- print preflight details
- print resolved plan
- print important warnings around secrets/auth modes/placeholders

This keeps reporting separate from decision-making.

#### `run-plan.ts`

- create/select Pulumi stacks
- set config
- execute preview/up/destroy flows
- handle retry/timeout behavior
- perform targeted cleanup hooks such as Flux pre-destroy cleanup

This keeps the Automation API runtime behavior in one place.

### Intended command shape

`infra/src/commands/bootstrap.ts` should eventually read like this:

```ts
const options = parseBootstrapCli(process.argv)
const context = await resolveBootstrapContext(options)
const plan = buildBootstrapPlan(context)
printBootstrapPlan(plan)
await runBootstrapPlan(plan)
```

That is the main deslopification target for orchestration.

## Shared AWS / Process / Temp Utilities

Both `bootstrap` and `verify-destroy` currently need similar imperative support
code. That support should live in shared libraries instead of being redefined in
each command.

Target areas:

- `infra/src/lib/aws/cli.ts`
- `infra/src/lib/aws/organizations.ts`
- `infra/src/lib/aws/sts.ts`
- `infra/src/lib/aws/iam.ts`
- `infra/src/lib/aws/eks.ts`
- `infra/src/lib/process/exec.ts`
- `infra/src/lib/temp/kubeconfig.ts`

### Design intent

- one consistent `runAwsJson` boundary
- one consistent command execution boundary
- one consistent temp kubeconfig lifecycle helper
- no duplicate logic for assuming roles, listing org accounts, checking IAM
  roles, or wiring short-lived kubeconfig files

These helpers should be small and boring. The point is reuse and consistency,
not clever abstraction.

## GitOps Rendering Design

`render.ts` should become a command plus a small GitOps rendering library.

Target files:

- `infra/src/commands/render-gitops.ts`
- `infra/src/lib/gitops/app-definition.ts`
- `infra/src/lib/gitops/discover-manifests.ts`
- `infra/src/lib/gitops/builders.ts`
- `infra/src/lib/gitops/render-bundle.ts`

### Command naming

The canonical internal name is `render-gitops`, because it is more specific than
`render`. If script compatibility is important, keep the package-level command
name stable by either:

- pointing the existing script to `infra/src/commands/render-gitops.ts`, or
- adding a tiny compatibility wrapper at `infra/src/commands/render.ts`

The implementation should preserve the operator experience even if the file name
becomes more explicit.

### Responsibilities

#### `app-definition.ts`

- define `AppDefinition`
- load and parse app YAML files

#### `discover-manifests.ts`

- load `apps/*/k8s/*.yaml`
- keep manifest discovery separate from rendering

#### `builders.ts`

- build Flux/Kustomization/Helm/ImageAutomation/Preview manifests
- stay pure where possible: inputs in, documents out

#### `render-bundle.ts`

- create output directories
- copy static source manifests
- write rendered files to disk

### YAML strategy

The current implementation hand-builds YAML strings in many places. The first
split can preserve behavior, but the preferred follow-up cleanup is to move
toward object-based manifest building and YAML serialization.

Reasoning:

- less brittle escaping
- fewer ad hoc helpers like manual string quoting
- easier testability of generated structures

This YAML cleanup is valuable, but it is secondary to the directory and boundary
refactor.

## Destroy Verification Design

`verify-destroy.ts` should become a thin command on top of reusable checks.

Target files:

- `infra/src/commands/verify-destroy.ts`
- `infra/src/lib/verification/check-destroy.ts`
- `infra/src/lib/verification/report.ts`

### Responsibilities

#### `check-destroy.ts`

- assume into target accounts
- verify EKS cluster absence
- verify Flux namespace absence when the cluster still exists
- verify IAM role absence
- return structured results instead of printing everything inline

#### `report.ts`

- render pass/fail output consistently
- compute final failure count / failure summary

This keeps verification logic testable and lets command output evolve without
rewriting the checks themselves.

## Migration Plan

### Phase 1: create destination directories

- add `infra/src/commands`
- add `infra/src/lib`
- add `infra/src/programs`

### Phase 2: move Pulumi programs

- move `infra/src/organization` to `infra/src/programs/organization`
- move `infra/src/platform` to `infra/src/programs/platform`
- audit and update all path consumers to point at `programs/...`

Known consumers include:

- bootstrap stack workdirs
- `platform-recovery`
- package scripts
- docs and any tests or fixtures that reference `src/organization` or
  `src/platform`

This should happen early because it establishes the new mental model.

### Phase 3: add thin command wrappers

- create new `commands/*` entrypoints
- keep CLI behavior stable
- update `infra/package.json` scripts to point at the new command paths

The goal is for users to keep running the same package scripts even though the
internal layout changes.

### Phase 4: split bootstrap internals

- move parser/context/planning/reporting/execution concerns into
  `infra/src/lib/bootstrap/*`
- keep behavior stable while shrinking `commands/bootstrap.ts`

### Phase 5: split render and verification internals

- extract GitOps rendering logic into `infra/src/lib/gitops/*`
- extract destroy verification checks/reporting into
  `infra/src/lib/verification/*`

### Phase 6: deduplicate shared imperative helpers

- consolidate AWS/process/temp helpers under `infra/src/lib/*`
- remove duplicated one-off implementations from command modules

### Phase 7: optional quality pass

- improve YAML generation strategy in GitOps rendering
- add focused tests around pure builders/checks

## Error Handling

The design favors errors surfacing at the correct layer.

- `commands/*` should convert thrown errors into concise operator-facing output
- `lib/bootstrap/resolve-context.ts` should fail fast on auth/discovery/input
  issues
- `lib/bootstrap/run-plan.ts` should own retry/timeout behavior for stack
  operations
- verification and rendering libraries should return structured results where
  that improves reporting clarity

This keeps imperative failures close to the boundary where they occur.

## Testing Strategy

After implementation, validate the refactor with:

- `pnpm --dir infra typecheck`
- smoke tests for command argument parsing and script entrypoints
- one `bootstrap --check` run to verify orchestration wiring
- one GitOps render smoke test to verify output shape remains correct
- focused tests or snapshots for pure manifest builders where practical
- destroy verification smoke tests where credentials/environment are available

## Success Criteria

- `infra/src` clearly separates programs, commands, and shared libraries
- `organization` and `platform` live under `infra/src/programs/`
- top-level orchestration commands live under `infra/src/commands/`
- `bootstrap` is easier to read because parsing, context resolution, planning,
  reporting, and execution are split
- `render-gitops` and `verify-destroy` stop feeling like random standalone
  scripts
- shared AWS/process/temp logic exists in one place instead of being duplicated
- `infra/package.json` scripts still provide a clean operator experience

## Out of Scope

- redesigning the Pulumi program model itself
- merging commands into a single unified CLI in this pass
- unrelated refactors inside the `organization` or `platform` resource graphs
- changing deployment semantics beyond what is required for path updates and
  internal code movement
