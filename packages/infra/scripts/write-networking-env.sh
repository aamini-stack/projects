#!/bin/bash
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
ENV_FILE="$REPO_ROOT/packages/infra/manifests/system/networking.env"

cat >"$ENV_FILE" <<EOF
TRAEFIK_PUBLIC_IP=$1
TRAEFIK_NODE_RESOURCE_GROUP=$2
CERT_MANAGER_CLIENT_ID=$3
AZURE_SUBSCRIPTION_ID=$4
AZURE_DNS_RESOURCE_GROUP=$5
EOF
