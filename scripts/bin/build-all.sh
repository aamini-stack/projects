#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"
cd "$REPO_ROOT"

# TODO: unhardcode
APPS=(dota-visualizer imdbgraph pc-tune-ups portfolio)

for app in "${APPS[@]}"; do
	node scripts/docker-build.js "$app"
done

echo "All images built!"
