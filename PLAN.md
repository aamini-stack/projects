# Modernize `imdbgraph` Database Infra While Keeping Azure Intact

## Summary

This is not a Vercel migration. Production compute stays on Vercel.

The immediate outage pressure is gone because Azure credits/limits were
restored. This plan is now a controlled reliability hardening effort: add and
validate an AWS RDS PostgreSQL path without deleting or destabilizing existing
Azure resources.

Priority order:

1. Keep production stable on the currently working Azure path.
2. Build an AWS RDS PostgreSQL path as a validated alternative.
3. Rebuild and verify schema/data on AWS using the checked-in flows.
4. Make cutover to AWS optional and reversible via `DATABASE_URL`.
5. Keep Azure resources intact as standby/fallback until explicitly retired in a
   separate project.

## What The Repo Confirms

- Production runtime contract is only `DATABASE_URL`.
- The current shared database module is Azure-specific in
  `packages/infra/src/postgres.ts`.
- The shared `AppDatabase` component is also Azure-specific because it creates
  the database with `azure.dbforpostgresql.Database` in
  `packages/infra/src/components/AppDatabase.ts`.
- `apps/imdbgraph/infra/index.ts` consumes those Azure-shaped outputs and
  exports the app `databaseUrl`.
- Recovery data paths already exist:
  - Drizzle migration in `apps/imdbgraph/src/db/migrations`
  - Populate script in `apps/imdbgraph/scripts/populate-db.ts`
  - IMDb scraper/update logic in `apps/imdbgraph/src/lib/imdb/scraper.ts`
- Only `staging` Pulumi stack config exists today for both `packages/infra` and
  `apps/imdbgraph/infra`. A production stack/config will need to be created as
  part of the migration.

## Research-Backed Decisions

### 1. The AWS move needs a real infra refactor, not just a host swap

The current app stack cannot be pointed at RDS by changing `postgresHost` alone.
The shared component creates the logical app database through the Azure
provider, so production recovery requires:

- AWS RDS provisioning in `packages/infra`
- AWS-shaped stack outputs from `packages/infra`
- An AWS-compatible app database component, likely backed by
  `@pulumi/postgresql` resources for database, role, grants, and extension
- An updated `apps/imdbgraph/infra/index.ts` that reads the new outputs and
  continues exporting `databaseUrl` in the existing format

### 2. For controlled rollout, assume Vercel stays external to AWS

Because production compute remains on Vercel, the database path must remain
reachable from Vercel Functions. Current Vercel docs state that default egress
is not fixed; static outbound IPs require Vercel Static IPs or Secure Compute.

Inference: unless this project already has Vercel Static IPs or Secure Compute
enabled, the fastest initial rollout path is a publicly reachable RDS instance
with SSL required and least-privilege credentials. If the team already has
Vercel static egress available, the plan can tighten the security group during
implementation.

### 3. `pg_trgm` remains part of the target state

The app depends on trigram search behavior, and AWS RDS PostgreSQL supports the
`pg_trgm` extension. The AWS replacement must preserve extension enablement
during database bootstrap.

### 4. Rebuild is the bootstrap mechanism

The repo already has a migration and populate path. That is the fastest
bootstrap route for AWS validation and avoids depending on Azure restore/export
steps.

## Execution Phases

### 1. Build shared AWS database primitives

- Add `@pulumi/aws` to the shared infra package.
- Introduce an AWS RDS PostgreSQL module in `packages/infra`.
- Export the connection details the app stack needs.
- Keep existing Azure AKS/staging code in place.

### 2. Refactor app-specific database provisioning

- Replace Azure resource-group/server assumptions in the shared app database
  component.
- Provision the logical app database, app user, grants, and `pg_trgm` on the RDS
  instance.
- Keep the `databaseUrl` output contract unchanged for the app.

### 3. Rebuild and validate the AWS database

- Deploy the shared infra stack.
- Deploy the `imdbgraph` infra stack.
- Run the checked-in Drizzle migration against the new RDS database.
- Run `apps/imdbgraph/scripts/populate-db.ts` against the new database.

### 4. Optional cutover (reversible)

- Update only the production `DATABASE_URL` secret/value in Vercel when ready.
- Trigger/redeploy production.
- Validate search, ratings, and populate behavior against the active DB path.
- Keep Azure production resources available for rapid rollback.

### 5. Keep Azure resources; do not delete in this project

- Do not remove Azure production resources as part of this plan.
- Treat any Azure decommissioning as a separate, explicitly approved project.
- Leave staging AKS/Azure code alone unless staging is explicitly migrated in a
  later project.

## Validation Targets

- `packages/infra` typechecks with AWS additions.
- `apps/imdbgraph/infra` typechecks after the Azure coupling is removed.
- Pulumi preview for the production stack shows AWS RDS resources and the app DB
  resources required for `imdbgraph`.
- Drizzle migration succeeds against RDS.
- Populate succeeds against RDS.
- Search works on the currently active production database path.
- Ratings pages work on the currently active production database path.
- Scheduled populate still succeeds after optional cutover.
- Azure resources remain present and unchanged by this plan's completion.

## Assumptions And Risks

- Production compute remains on Vercel and is out of scope.
- Production modernization uses a new production Pulumi stack/config, because
  only `staging` exists today in the repo.
- Rebuilding from IMDb data is acceptable; no Azure data export/restore is
  required.
- If Vercel Static IPs or Secure Compute are not already enabled, the initial
  RDS instance will likely need to be publicly reachable for rollout speed.
- Hardening the network path beyond that should be treated as follow-up work
  after AWS validation.

## Sources

Checked on 2026-03-14.

### Local repo inspection

- `packages/infra/src/postgres.ts`
- `packages/infra/src/components/AppDatabase.ts`
- `apps/imdbgraph/infra/index.ts`
- `apps/imdbgraph/scripts/populate-db.ts`
- `apps/imdbgraph/src/db/migrations/0000_marvelous_quasimodo.sql`
- `packages/infra/Pulumi.staging.yaml`
- `apps/imdbgraph/infra/Pulumi.staging.yaml`

### External docs

- Pulumi AWS RDS Instance:
  https://www.pulumi.com/registry/packages/aws/api-docs/rds/instance/
- Pulumi PostgreSQL Database:
  https://www.pulumi.com/registry/packages/postgresql/api-docs/database/
- Pulumi PostgreSQL Role:
  https://www.pulumi.com/registry/packages/postgresql/api-docs/role/
- Pulumi PostgreSQL Extension:
  https://www.pulumi.com/registry/packages/postgresql/api-docs/extension/
- Amazon RDS for PostgreSQL extensions:
  https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.Extensions.html
- Vercel Secure Compute: https://vercel.com/docs/secure-compute
- Vercel Static IPs announcement:
  https://vercel.com/changelog/static-ips-are-now-available-for-more-secure-connectivity
