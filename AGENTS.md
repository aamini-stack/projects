# @aamini Monorepo

This is a personal mono-repo where I host all my apps. The monorepo is managed
with turborepo and pnpm workspaces. All my apps are in ./apps/$APPNAME. Global
packages are in ./packages like ./packages/infra where bootstrap scripts and
pulumi code is located.

## Code Style

- CRITICAL: USE PNPM!!! (NOT npm!!!)
- Prefer 'dirty' code. I'm not in the mood for Uncle Bob style of breaking a
  simple problem into 500 microfunctions.
