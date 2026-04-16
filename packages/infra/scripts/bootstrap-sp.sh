#!/usr/bin/env bash
#
# Creates the staging service principal and grants subscription-scoped access.
# Run with a privileged bootstrap identity, then run Pulumi with the service principal.
#
set -euo pipefail

SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-331269d5-143f-4246-b389-9c1f41bb5882}"
SERVICE_PRINCIPAL_NAME="aamini-platform-staging"

SUBSCRIPTION_SCOPE="/subscriptions/${SUBSCRIPTION_ID}"

resolve_service_principal() {
	local object_id
	local app_id

	object_id="$(az ad sp list --display-name "$SERVICE_PRINCIPAL_NAME" --query '[0].id' -o tsv)"
	app_id="$(az ad sp list --display-name "$SERVICE_PRINCIPAL_NAME" --query '[0].appId' -o tsv)"

	if [[ -n "$object_id" && "$object_id" != "null" && -n "$app_id" && "$app_id" != "null" ]]; then
		SP_OBJECT_ID="$object_id"
		SP_APP_ID="$app_id"
		return
	fi

	app_id="$(az ad sp create-for-rbac --name "$SERVICE_PRINCIPAL_NAME" --create-password false --query appId -o tsv)"
	object_id="$(az ad sp show --id "$app_id" --query id -o tsv)"
	SP_OBJECT_ID="$object_id"
	SP_APP_ID="$app_id"
}

resolve_service_principal
TENANT_ID="$(az account show --query tenantId -o tsv)"

ensure_role_assignment() {
	local scope="$1"
	local role="$2"

	if [[ "$(az role assignment list --assignee-object-id "$SP_OBJECT_ID" --scope "$scope" --query "[?roleDefinitionName=='$role'] | length(@)" -o tsv)" != "0" ]]; then
		return
	fi

	az role assignment create \
		--assignee-object-id "$SP_OBJECT_ID" \
		--assignee-principal-type ServicePrincipal \
		--role "$role" \
		--scope "$scope"
}

az account set --subscription "$SUBSCRIPTION_ID"

ensure_role_assignment "$SUBSCRIPTION_SCOPE" "Contributor"
ensure_role_assignment "$SUBSCRIPTION_SCOPE" "User Access Administrator"
ensure_role_assignment "$SUBSCRIPTION_SCOPE" "Azure Kubernetes Service Cluster User Role"

printf '\nReset client secret for %s and print it now? [y/N] ' "$SERVICE_PRINCIPAL_NAME"
read -r should_reset_secret

if [[ "$should_reset_secret" =~ ^[Yy]$ ]]; then
	SP_CLIENT_SECRET="$(az ad sp credential reset --id "$SP_APP_ID" --append --display-name codex-agent --years 1 --query password -o tsv)"
	printf 'Client secret: %s\n' "$SP_CLIENT_SECRET"
	printf '\nLogin command (client secret flow):\n'
	printf 'az login --service-principal --username %s --tenant %s --password "%s"\n' "$SP_APP_ID" "$TENANT_ID" "$SP_CLIENT_SECRET"
fi
