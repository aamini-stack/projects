#!/usr/bin/env bash
set -euo pipefail

# Generate a SealedSecret YAML from key=value pairs.
# Requires kubectl and kubeseal on the PATH.
#
# Usage:
#   seal.sh --name <secret-name> --namespace <ns> --output <path> KEY=VALUE ...

name=""
namespace=""
output=""
literals=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)      name="$2";      shift 2 ;;
    --namespace) namespace="$2"; shift 2 ;;
    --output)    output="$2";    shift 2 ;;
    *=*)         literals+=("--from-literal=$1"); shift ;;
    *)           echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$name" || -z "$namespace" || -z "$output" || ${#literals[@]} -eq 0 ]]; then
  echo "Usage: seal.sh --name NAME --namespace NS --output PATH KEY=VALUE ..." >&2
  exit 1
fi

mkdir -p "$(dirname "$output")"

kubectl create secret generic "$name" \
  --namespace "$namespace" \
  --dry-run=client -o yaml \
  "${literals[@]}" |
  kubeseal --format=yaml \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system > "$output"
