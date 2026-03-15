# Agent Staging SSO Runbook

This runbook documents the minimal operator path for IAM Identity Center login
with staging-safe guardrails.

## What Pulumi manages

- Permission set: `agent-staging`
- Target account: `302481198387`
- Principal: Identity Center user `ai-agent`
- Inline policy source:
  `packages/infra/iam/agent-staging-permission-set-policy.json`

Guardrails in the policy:

- Explicit deny outside `us-east-1`
- Explicit deny for resources tagged `Environment=prod`
- Explicit deny for `prod-*` named resources (S3/Lambda/Secrets/RDS/Logs)
- Explicit deny for IAM/Organizations/account control-plane APIs

## Local AWS CLI profile

Configure the local profile once:

```bash
aws configure set profile.agent-staging.sso_start_url https://d-906604ca32.awsapps.com/start
aws configure set profile.agent-staging.sso_region us-east-1
aws configure set profile.agent-staging.sso_account_id 302481198387
aws configure set profile.agent-staging.sso_role_name agent-staging
aws configure set profile.agent-staging.region us-east-1
aws configure set profile.agent-staging.output json
```

Login:

```bash
aws sso login --profile agent-staging
```

Identity check:

```bash
aws sts get-caller-identity --profile agent-staging
```

## Pulumi usage

Use these env vars when operating with this profile:

```bash
export AWS_PROFILE=agent-staging
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

Authentication check against production stack preview:

```bash
cd packages/infra
pulumi preview --stack production
```
