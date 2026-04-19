# Plan

1. Fix platform Postgres admin resource
Use `azure.dbforpostgresql.Administrator`, not `AdministratorsMicrosoftEntra`.

```ts
const postgresEntraAdmin = new azure.dbforpostgresql.Administrator(
  'postgres-entra-admin',
  {
    resourceGroupName: resourceGroup.name,
    serverName: server.name,
    objectId: adminPrincipal.objectId,
    principalName: adminPrincipal.principalName,
    principalType: 'Group', // or 'ServicePrincipal'
    tenantId: currentClient.tenantId,
  },
  { dependsOn: [server] },
)
```

Define `adminPrincipal` from config, not discovery hacks:

```ts
interface PostgresAdminConfig {
  objectId: string
  principalName: string
  principalType: 'Group' | 'ServicePrincipal' | 'User'
}

const adminPrincipal = config.requireObject<PostgresAdminConfig>('postgresAdmin')
```

2. Export correct stack outputs
Do not export full `server` object as admin username.

```ts
export const postgresHost = server.fullyQualifiedDomainName
export const postgresAdminUser = postgresEntraAdmin.principalName
export const postgresServerName = server.name
```

3. Finish `AppDatabase` component
Current file is half-broken. Add missing input and assign outputs.

```ts
export interface AppDatabaseArgs {
  name: pulumi.Input<string>
  serverResourceGroupName: pulumi.Input<string>
  serverName: pulumi.Input<string>
  serverHost: pulumi.Input<string>
  adminUser: pulumi.Input<string>
  runtimePrincipalObjectId: pulumi.Input<string>
}
```

```ts
const appUserName = pulumi.output(args.name)
this.userName = role.name
```

4. Wire app runtime identity into DB role mapping
Keep admin identity separate from app runtime identity.

```ts
const appDb = new AppDatabase('imdbgraph', {
  name: 'imdbgraph',
  serverResourceGroupName: serverResourceGroup,
  serverName,
  serverHost: dbHost,
  adminUser: globalStack.getOutput('postgres').apply(pg => pg.postgresAdminUser),
  runtimePrincipalObjectId: runtimeIdentity.principalId,
})
```

5. Keep DB access bound to workload identity, not image
DB side can only trust identity. Use:
dedicated UAMI per app
federated credential pinned to exact service account
`pgaadauth` label pinned to that identity object id

```ts
label: pulumi.interpolate`aadauth,oid=${args.runtimePrincipalObjectId},type=service`
```

6. Enforce image restriction in Kubernetes, not DB
If you want “only this image can access DB”, add admission policy so only approved digest can use that service account.
DB alone cannot distinguish image digest.

Example policy direction:
Kyverno / Gatekeeper rule:
match pods using `serviceAccountName: imdbgraph`
require image exactly `repo/imdbgraph@sha256:...`

7. Config changes
Add explicit admin principal config in `packages/infra/Pulumi.staging.yaml`.

```yaml
config:
  aamini-platform:postgresAdmin:
    objectId: 00000000-0000-0000-0000-000000000000
    principalName: grp-pg-aamini-staging-admins
    principalType: Group
```

## Recommended admin name

Use Entra group:
`grp-pg-aamini-staging-admins`

## Execution order

1. Patch `packages/infra/src/postgres.ts`
2. Patch `packages/infra/src/components/AppDatabase.ts`
3. Patch `apps/imdbgraph/infra/index.ts`
4. Add `postgresAdmin` config
5. `pulumi preview` platform stack
6. `pulumi preview` app stack
7. Optional: add admission policy for image digest pinning

## Non-goals

No CLI shell-outs in Pulumi
No runtime inference of current Azure principal
No sharing admin identity with app runtime identity
