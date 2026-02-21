#!/usr/bin/env bash
#
# Usage: aamini seal
#
# Loops through all apps/ directories, and for each one that has a .env.local,
# seals it with kubeseal and writes the SealedSecret to apps/<app-name>/k8s/sealed-secret.yaml.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"

for APP_DIR in "$REPO_ROOT"/apps/*/; do
	APP="$(basename "$APP_DIR")"
	ENV_FILE="$APP_DIR.env.local"

	if [[ ! -f "$ENV_FILE" ]]; then
		continue
	fi

	OUTPUT="$APP_DIR/k8s/sealed-secret.yaml"
	mkdir -p "$(dirname "$OUTPUT")"

	echo "Sealing $APP..."

	kubectl create secret generic "$APP-secrets" \
		--namespace "$APP" \
		--from-env-file="$ENV_FILE" \
		--dry-run=client -o yaml |
		kubeseal --format=yaml \
			--controller-name=sealed-secrets \
			--controller-namespace=kube-system |
		sed "s/^  name: $APP-secrets$/  name: secrets/" \
		>"$OUTPUT"

	echo "Written to $OUTPUT"
done
