#!/usr/bin/env bash
#
# Bootstrap script for the Pulumi service principal.
#
# These role assignments cannot be self-assigned via Pulumi (chicken-and-egg),
# so they must be run once by a privileged identity (e.g. Owner/Global Admin).
#
# Usage:
#   az login  # with a privileged identity
#   ./scripts/bootstrap-sp.sh
#
set -euo pipefail

SUBSCRIPTION_ID="331269d5-143f-4246-b389-9c1f41bb5882"
SP_OBJECT_ID="8fec6fa3-7774-4112-83d1-30638a065348"
RESOURCE_GROUP="rg-aamini-staging"
NODE_RESOURCE_GROUP="MC_rg-aamini-staging_aks-staging_westus"

RG_SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}"
NODE_RG_SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${NODE_RESOURCE_GROUP}"
AKS_SCOPE="${RG_SCOPE}/providers/Microsoft.ContainerService/managedClusters/aks-staging"

echo "Assigning roles to SP ${SP_OBJECT_ID}..."

# Contributor on the main resource group (create/update all resources)
az role assignment create \
  --assignee "$SP_OBJECT_ID" \
  --role "Contributor" \
  --scope "$RG_SCOPE"

# User Access Administrator on the main resource group (create role assignments for workload identities)
az role assignment create \
  --assignee "$SP_OBJECT_ID" \
  --role "User Access Administrator" \
  --scope "$RG_SCOPE"

# Contributor on the AKS node resource group (create static IPs for LoadBalancer)
az role assignment create \
  --assignee "$SP_OBJECT_ID" \
  --role "Contributor" \
  --scope "$NODE_RG_SCOPE"

# AKS Cluster User Role (list kubeconfig credentials)
az role assignment create \
  --assignee "$SP_OBJECT_ID" \
  --role "Azure Kubernetes Service Cluster User Role" \
  --scope "$AKS_SCOPE"

echo "Done. RBAC propagation may take 1-2 minutes."
