#!/bin/bash
set -e

# Usage: aamini e2e <app-name> [playwright-args...]
# Example: aamini e2e imdbgraph
# Example: aamini e2e imdbgraph --update-snapshots

if [ -z "$1" ]; then
  echo "Error: APP_NAME is required"
  echo "Usage: aamini e2e <app-name> [playwright-args...]"
  exit 1
fi

APP_NAME=$1
shift # Remove first arg, rest are playwright args

# Navigate to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"
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
  -e DATABASE_URL \
  -v "$(pwd)/apps/$APP_NAME/test-results:/app/apps/$APP_NAME/test-results" \
  -v "$(pwd)/apps/$APP_NAME/playwright-report:/app/apps/$APP_NAME/playwright-report" \
  -v "$(pwd)/apps/$APP_NAME/e2e:/app/apps/$APP_NAME/e2e" \
  "$APP_NAME-e2e:latest" \
  "$@"
