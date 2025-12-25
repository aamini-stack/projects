#!/usr/bin/env bash
set -e

# Images mapping: app-name:image-name:tag
declare -a APPS=(
  "ducky-mot:ghcr.io/aamini-stack/ducky-mot:main"
  "imdbgraph:ghcr.io/aamini11/imdbgraph-client:main"
  "pc-tune-ups:ghcr.io/aamini-stack/pc-tune-ups:main"
  "portfolio:ghcr.io/aamini-stack/portfolio:main"
)

for app_config in "${APPS[@]}"; do
  IFS=':' read -r app image tag <<< "$app_config"

  echo "Building $app..."
  docker build --build-arg APP_NAME="$app" --target production -f Dockerfile -t "$image:$tag" .

  echo "Pushing $image:$tag..."
  docker push "$image:$tag"

  echo "✓ Done: $app"
  echo ""
done

echo "All images built and pushed!"
