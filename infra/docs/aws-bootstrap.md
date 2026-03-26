# AWS bootstrap runbook

This runbook keeps the manual bootstrap as small as possible. Use the root user
exactly once to create the first human admin path, then switch to SSO for all
Pulumi work. The day-to-day roles are `admin`, `operator`, and `developer`.

## Target organization layout

```text
Organization
├─ Root
│  ├─ management account
│  ├─ Infrastructure OU
│  └─ Workloads OU
│     ├─ staging account
│     └─ production account
```

Important: the AWS Organizations management account cannot be moved into an OU.
It always stays directly under the org root. The `Infrastructure` OU is still
useful for future shared-infra accounts, but `management` remains at `Root`.

## Fixed names

- Management account ID: `302481198387`
- Admin profile: `admin`
- Operator profile: `operator`
- Developer profile: `developer`
- Bootstrap admin permission set: `AWSAdministratorAccess`
- Operator permission set: `OperatorAccess`
- Developer permission set: `DeveloperAccess`
- Read-only permission set: `ReadOnlyAccess`
- Organization stack: `infra/src/organization`
- Platform stack: `infra/src/platform`

## One-time bootstrap checklist

### 1. Sign in as the root user

- Confirm the AWS account ID is `302481198387`
- Do not create access keys for the root user
- Enable hardware MFA on the root user before continuing

### 2. Enable organization services

- Open `AWS Organizations`
- If the organization does not exist yet, create it with this account as the
  management account
- Open `IAM Identity Center`
- Enable Identity Center in `us-east-1`

### 3. Create the first human access path

- Create your user in Identity Center
- Create groups: `Admins`, `Operators`, `Developers`, `ReadOnly`
- Add your user to `Admins`, `Operators`, and `Developers`
- Assign the existing `AWSAdministratorAccess` permission set to `Admins` on
  account `302481198387` (this is your bootstrap access)
- Copy the group IDs and update `infra/src/organization/Pulumi.global.yaml`:
  - `organization:identity.adminsGroupId`
  - `organization:identity.operatorsGroupId`
  - `organization:identity.developersGroupId`
  - `organization:identity.readOnlyGroupId`
- Run the organization stack as `admin` to create the managed permission sets
- After the first org deploy, Pulumi will assign:
  - `OperatorAccess` → `Operators` group
  - `DeveloperAccess` → `Developers` group
  - `ReadOnlyAccess` → `ReadOnly` group
  - `AWSAdministratorAccess` → `Admins` group (for break-glass)

### 4. Stop using root

- Sign out of the root user
- Store the root credentials offline as break-glass only
- Use the root user only for rare billing or account recovery tasks

## Local CLI setup

Add these profiles to `~/.aws/config`:

```ini
[profile admin]
sso_start_url = https://YOUR-PORTAL.awsapps.com/start
sso_region = us-east-1
sso_account_id = 302481198387
sso_role_name = AWSAdministratorAccess
region = us-east-1
output = json

[profile operator]
sso_start_url = https://YOUR-PORTAL.awsapps.com/start
sso_region = us-east-1
sso_account_id = 302481198387
sso_role_name = OperatorAccess
region = us-east-1
output = json

[profile developer]
sso_start_url = https://YOUR-PORTAL.awsapps.com/start
sso_region = us-east-1
sso_account_id = 302481198387
sso_role_name = DeveloperAccess
region = us-east-1
output = json
```

Login checks:

```bash
aws sso login --profile admin
AWS_PROFILE=admin aws sts get-caller-identity

aws sso login --profile operator
AWS_PROFILE=operator aws sts get-caller-identity

aws sso login --profile developer
AWS_PROFILE=developer aws sts get-caller-identity
```

Expected account ID for both commands: `302481198387`

## Safe deployment flow

### Organization stack

Use the `admin` session:

```bash
cd /home/aamini.linux/projects/infra/src/organization
AWS_PROFILE=admin ../../scripts/aws-preflight.sh organization
AWS_PROFILE=admin pulumi preview
AWS_PROFILE=admin pulumi up
```

### Staging platform stack

Use the `developer` session:

```bash
cd /home/aamini.linux/projects/infra/src/platform
AWS_PROFILE=developer ../../scripts/aws-preflight.sh platform-staging
AWS_PROFILE=developer pulumi preview --stack staging
AWS_PROFILE=developer pulumi up --stack staging
```

### Production platform stack

Use the `operator` session:

```bash
cd /home/aamini.linux/projects/infra/src/platform
AWS_PROFILE=operator ../../scripts/aws-preflight.sh platform-production
AWS_PROFILE=operator pulumi preview --stack production
AWS_PROFILE=operator pulumi up --stack production
```

## What Pulumi owns after bootstrap

- `Infrastructure` OU
- `Workloads` OU
- `staging` and `production` account guardrails and deploy roles
- Identity Center permission sets and management-account assignments for
  `admin`, `operator`, `developer`, and `read-only` access

## Failure rules

- If `aws sts get-caller-identity` shows the wrong account, stop
- If the ARN does not include the expected SSO role, stop
- If you are in the wrong directory for the target stack, stop
- If a command would require root, stop and update the runbook instead
