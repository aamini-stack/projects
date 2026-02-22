flux bootstrap github \
 --owner=aamini-stack \
 --repository=projects \
 --branch=infra \
 --path=./packages/infra/manifests/gitops \
 --personal --force

pulumi config get github:token

Architecture baseline: `packages/infra/docs/platform-architecture-baseline.md`
