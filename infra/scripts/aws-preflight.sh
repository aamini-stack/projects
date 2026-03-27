#!/usr/bin/env bash

set -euo pipefail

usage() {
	cat <<'EOF'
Usage: aws-preflight.sh <target>

Targets:
  organization
  platform-staging
  platform-production
EOF
}

if [[ $# -ne 1 ]]; then
	usage
	exit 1
fi

target="$1"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
infra_dir="$(cd -- "$script_dir/.." && pwd -P)"
cwd="$(pwd -P)"

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

require_command aws
require_command pulumi
require_command python3

if [[ -z "${AWS_PROFILE:-}" ]]; then
	echo 'AWS_PROFILE must be set to an SSO profile before running this script.' >&2
	exit 1
fi

management_account_id="302481198387"
expected_stack=''
expected_dir=''
expected_role_fragment=''

case "$target" in
	organization)
		expected_dir="$infra_dir/src/organization"
		expected_role_fragment='AWSReservedSSO_AWSAdministratorAccess_'
		expected_stack='global'
		;;
	platform-staging)
		expected_dir="$infra_dir/src/platform"
		expected_role_fragment='AWSReservedSSO_DeveloperAccess_'
		expected_stack='staging'
		;;
	platform-production)
		expected_dir="$infra_dir/src/platform"
		expected_role_fragment='AWSReservedSSO_OperatorAccess_'
		expected_stack='production'
		;;
	*)
		usage
		exit 1
		;;
esac

if [[ "$cwd" != "$expected_dir" ]]; then
	echo "Run this command from $expected_dir, current directory is $cwd" >&2
	exit 1
fi

caller_json="$(aws sts get-caller-identity --output json)"
caller_account_id="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Account"])' <<<"$caller_json")"
caller_arn="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Arn"])' <<<"$caller_json")"

if [[ "$caller_account_id" != "$management_account_id" ]]; then
	echo "Expected AWS account $management_account_id, got $caller_account_id" >&2
	exit 1
fi

if [[ "$caller_arn" != *"$expected_role_fragment"* ]]; then
	echo "Expected caller ARN to contain $expected_role_fragment, got $caller_arn" >&2
	exit 1
fi

current_stack=''
if pulumi stack --show-name >/dev/null 2>&1; then
	current_stack="$(pulumi stack --show-name)"
fi

if [[ -n "$current_stack" && "$current_stack" != "$expected_stack" ]]; then
	echo "Expected Pulumi stack $expected_stack, got $current_stack" >&2
	exit 1
fi

cat <<EOF
Preflight OK
- target: $target
- aws_profile: $AWS_PROFILE
- account_id: $caller_account_id
- caller_arn: $caller_arn
- directory: $cwd
- stack: ${current_stack:-$expected_stack}
EOF
