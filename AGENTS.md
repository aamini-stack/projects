# @aamini-stack Monorepo

## Code Style

- CRITICAL: USE PNPM!!! (NOT npm!!!)
- Prefer 'dirty' code. By dirty code I mean code that is not endlessly
  over-engineered and over-abstracted. Don't do unclebob "clean code" where you
  split a simple task into 500 1-line microfunctions.

## Skills

- `playwriter`: Use this for any task that requires UI work. Playwriter is a CLI
  that lets you control a playwright browser for testing UI changes and taking
  screenshots.
- `frontend`: Use this skill for any frontend/ui design work.

## Verification

After completing a task, run `pnpm verify` in the relevant app directory to
ensure all checks pass (build, lint, format, typecheck, test, e2e).
