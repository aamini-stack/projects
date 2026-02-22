#!/usr/bin/env bash
#
# Usage: aamini unseal
#
# Loops through all apps/ directories, and for each one that has a
# k8s/sealed-secret.yaml, reads the unsealed Kubernetes Secret from the cluster
# and writes key/value pairs to apps/<app-name>/.env.local.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"

DEFAULT_SECRET_NAME="${SEALED_SECRET_NAME:-}"
DEFAULT_NAMESPACE="${SEALED_SECRET_NAMESPACE:-}"

for APP_DIR in "$REPO_ROOT"/apps/*/; do
	APP="$(basename "$APP_DIR")"
	SEALED_SECRET_FILE="$APP_DIR/k8s/sealed-secret.yaml"
	ENV_FILE="$APP_DIR/.env.local"

	if [[ ! -f "$SEALED_SECRET_FILE" ]]; then
		continue
	fi

	SECRET_NAME="$DEFAULT_SECRET_NAME"
	if [[ -z "$SECRET_NAME" ]]; then
		SECRET_NAME="$(kubectl create --dry-run=client -f "$SEALED_SECRET_FILE" -o jsonpath='{.spec.template.metadata.name}' 2>/dev/null || true)"
	fi
	if [[ -z "$SECRET_NAME" ]]; then
		SECRET_NAME="secrets"
	fi

	NAMESPACE="$DEFAULT_NAMESPACE"
	if [[ -z "$NAMESPACE" ]]; then
		NAMESPACE="$(kubectl create --dry-run=client -f "$SEALED_SECRET_FILE" -o jsonpath='{.spec.template.metadata.namespace}' 2>/dev/null || true)"
	fi
	if [[ -z "$NAMESPACE" ]]; then
		NAMESPACE="$APP"
	fi

	echo "Unsealing $APP..."

	if ! kubectl get secret "$SECRET_NAME" --namespace "$NAMESPACE" >/dev/null 2>&1; then
		echo "Skipping $APP: secret '$SECRET_NAME' not found in namespace '$NAMESPACE'"
		continue
	fi

	kubectl get secret "$SECRET_NAME" --namespace "$NAMESPACE" -o json |
		python3 -c 'import base64, json, sys
secret = json.load(sys.stdin)
for key in sorted(secret.get("data", {})):
    value = base64.b64decode(secret["data"][key]).decode("utf-8")
    print(f"{key}={value}")
' >"$ENV_FILE"

	echo "Written to $ENV_FILE"
done
