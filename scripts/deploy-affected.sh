#!/bin/bash

set -e

AFFECTED_APPS=$(pnpm turbo ls --affected --output=json | jq -c '[.packages.items[] | select(.path | contains("apps/")) | select(.name | contains("-e2e") | not) | .name]')
URLS="{}"

for app in $(echo "$AFFECTED_APPS" | jq -r '.[]'); do
  URL=$(vercel deploy ./apps/$app --yes --token=$VERCEL_TOKEN --scope=$TURBO_TEAM ${{ github.ref == 'refs/heads/main' && '--production' || '' }})
  URLS=$(echo "$URLS" | jq --arg key "$app" --arg value "$URL" '. + {($key): $value}')
done

echo "urls=$URLS" >> $GITHUB_OUTPUT
