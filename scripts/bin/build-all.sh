#!/usr/bin/env bash
set -e
# TODO: unhardcode
APPS=(dota-visualizer imdbgraph pc-tune-ups portfolio)

for app in "${APPS[@]}"; do
	node scripts/docker-build.js "$app"
done

echo "All images built!"
