# Local Test Fixtures

Use Docker Compose for Postgres + MinIO, then seed fixtures:

```bash
pnpm test:fixtures
```

Run app against fixture env:

```bash
pnpm dev:test
```

Tear down stack:

```bash
pnpm test:infra:down
```

Playwright uses same fixture seeding via `e2e/global-setup.ts`.
