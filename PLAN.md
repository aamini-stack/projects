# Fix Cloudflare DNS Drift with ExternalDNS

## Problem

Pulumi manages a wildcard `A` record (`*.ariaamini.com`), but specific per-app
`A` records (e.g., `imdbgraph.ariaamini.com`) were created outside Pulumi and
got left behind when the cluster was rebuilt. DNS prioritizes specific records
over wildcards, so traffic for `imdbgraph.ariaamini.com` kept routing to the old
dead IP (`52.190.179.228`), causing 522 errors from Cloudflare.

## Solution

Use ExternalDNS to watch `HTTPRoute` resources and automatically manage specific
`A` records in Cloudflare. This ensures records are created when apps deploy and
deleted when apps are removed.

## Step 1: Install ExternalDNS

Add to `packages/infra/manifests/platform/controllers/resources.yaml`:

```yaml
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: external-dns
  namespace: flux-system
spec:
  interval: 1h
  url: https://kubernetes-sigs.github.io/external-dns
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: external-dns
  namespace: networking
spec:
  interval: 10m
  chart:
    spec:
      chart: external-dns
      version: '1.x'
      sourceRef:
        kind: HelmRepository
        name: external-dns
        namespace: flux-system
  values:
    provider: cloudflare
    env:
      - name: CF_API_TOKEN
        valueFrom:
          secretKeyRef:
            name: cloudflare-api-token
            key: api-token
    sources:
      - gateway-httproute
    txtOwnerId: aamini-staging
    txtPrefix: _externaldns.
    domainFilters:
      - ariaamini.com
    serviceMonitor:
      enabled: false
```

## Step 2: Annotate HTTPRoutes

Replace `packages/infra/charts/app-release/templates/httproute.yaml`:

```yaml
{{- $name := include "app-release.name" . -}}
{{- $hosts := list .Values.host -}}
{{- if .Values.rootHost }}
{{- $hosts = append $hosts .Values.rootHost -}}
{{- end }}
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: {{ $name }}-http
  annotations:
    external-dns.alpha.kubernetes.io/hostname: {{ .Values.host | quote }}
  labels:
    app.kubernetes.io/name: {{ include "app-release.name" . }}
    app.kubernetes.io/instance: {{ include "app-release.name" . }}
    app: {{ include "app-release.name" . }}
spec:
  parentRefs:
    - name: traefik-gateway
      namespace: networking
      sectionName: web
  hostnames:
    {{- range $hosts }}
    - {{ . | quote }}
    {{- end }}
  rules:
    - filters:
        - type: RequestRedirect
          requestRedirect:
            scheme: https
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: {{ $name }}-https
  annotations:
    external-dns.alpha.kubernetes.io/hostname: {{ .Values.host | quote }}
  labels:
    app.kubernetes.io/name: {{ include "app-release.name" . }}
    app.kubernetes.io/instance: {{ include "app-release.name" . }}
    app: {{ include "app-release.name" . }}
spec:
  parentRefs:
    - name: traefik-gateway
      namespace: networking
      sectionName: websecure
  hostnames:
    {{- range $hosts }}
    - {{ . | quote }}
    {{- end }}
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: {{ $name }}-service
          port: {{ .Values.service.port }}
```

## Step 3: Cleanup Stale Records

One-time script to delete orphaned specific A records:

```bash
#!/bin/bash
set -e

CF_TOKEN="xBOaFN5Fe7tsTWsPC4QBDp1Sxb7qfgYGuQ_pQg3V"
ZONE_ID="3dba44a52b0356c316f1cc94669938a2"
CURRENT_IP=$(pulumi stack output aks --stack aamini11/aamini-platform/staging | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).ingressPublicIpAddress))")

curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A" \
  -H "Authorization: Bearer ${CF_TOKEN}" | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    data.result.forEach(r => {
      if (r.name === 'ariaamini.com' || r.name.startsWith('*.')) return;
      if (r.content !== '${CURRENT_IP}') {
        console.log('Deleting stale record:', r.name, '->', r.content);
        require('child_process').execSync(\`curl -s -X DELETE -H 'Authorization: Bearer ${CF_TOKEN}' 'https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/\${r.id}'\`);
      }
    });
  "
```

## Notes

- Pulumi should keep managing only the wildcard (`*` and `*.staging`). Do not
  add app hostnames to `cloudflareHostnames` in `cloudflare.ts`.
- ExternalDNS reuses the existing `cloudflare-api-token` Secret in the
  `networking` namespace.
- Gateway API CRDs are already present because Traefik is running.
