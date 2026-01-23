#!/bin/bash
set -e

# Usage: ./scripts/e2e.sh <app-name> [playwright-args...]
# Example: ./scripts/e2e.sh imdbgraph
# Example: ./scripts/e2e.sh imdbgraph --update-snapshots

if [ -z "$1" ]; then
  echo "Error: APP_NAME is required"
  echo "Usage: ./scripts/e2e.sh <app-name> [playwright-args...]"
  exit 1
fi

APP_NAME=$1
shift # Remove first arg, rest are playwright args

# Navigate to repository root (directory containing pnpm-workspace.yaml)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "Building e2e Docker image for $APP_NAME..."

# Determine if we should skip build (when BASE_URL is set or CI=true)
if [ -n "$BASE_URL" ] || [ "$CI" = "true" ]; then
  CI_ARG="--build-arg CI=true"
  echo "Using BASE_URL - skipping build in container"
else
  CI_ARG=""
  echo "No BASE_URL set - will build and serve locally"
fi

docker build \
  --build-arg APP_NAME="$APP_NAME" \
  $CI_ARG \
  --target e2e-test \
  -f Dockerfile \
  -t "$APP_NAME-e2e:latest" \
  .

echo "Running e2e tests for $APP_NAME..."

# Run tests
docker run --rm \
  -e BASE_URL \
  -v "$(pwd)/apps/$APP_NAME/test-results:/app/apps/$APP_NAME/test-results" \
  -v "$(pwd)/apps/$APP_NAME/playwright-report:/app/apps/$APP_NAME/playwright-report" \
  -v "$(pwd)/apps/$APP_NAME/e2e:/app/apps/$APP_NAME/e2e" \
  "$APP_NAME-e2e:latest" \
  "$@"
