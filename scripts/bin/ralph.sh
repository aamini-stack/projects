#!/bin/bash
# ralph.sh - Autonomous Ralph loop with deterministic CI enforcement
# Usage: aamini ralph [iterations]
# Example: aamini ralph 50

set -e

corepack enable

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"
PROMPT_PATH="$SCRIPT_DIR/RALPH.md"

ITERATIONS=${1:-20}
START_TIME=$(date +%s)
MAX_FIX_RETRIES=5

if [ ! -f "tasks.json" ]; then
	echo "Error: tasks.json not found in current directory"
	echo "Create tasks.json with your stories before running Ralph"
	exit 1
fi

if [ ! -f "$PROMPT_PATH" ]; then
	echo "Error: RALPH.md not found next to ralph.sh"
	echo "Expected prompt file at: $PROMPT_PATH"
	exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    RALPH LOOP                               ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Max iterations: $ITERATIONS"
echo "║  Max fix retries: $MAX_FIX_RETRIES"
echo "║  Working dir:    $(pwd)"
echo "║  Started at:     $(date)"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

count_remaining() {
	local count=$(cat tasks.json | node -e "
		const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
		let remaining = 0;
		for (const epic of data.epics || []) {
			for (const story of epic.stories || []) {
				if (!story.done) remaining++;
			}
		}
		console.log(remaining);
	" 2>/dev/null || echo "unknown")
	echo "$count"
}

get_app_dirs() {
	for dir in apps/*; do
		if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
			echo "$dir"
		fi
	done
}

run_ci_checks() {
	local failed=0
	local failed_check=""
	local failed_output=""
	local app_dir=""
	local output=""

	for app_dir in $(get_app_dirs); do

		echo ""
		echo "Checking $app_dir..."

		if ! output=$(cd "$app_dir" && pnpm typecheck 2>&1); then
			failed=1
			failed_check="typecheck"
			failed_output="$output"
			break
		fi
		echo "  ✓ typecheck"

		if ! output=$(cd "$app_dir" && pnpm lint 2>&1); then
			failed=1
			failed_check="lint"
			failed_output="$output"
			break
		fi
		echo "  ✓ lint"

		if ! output=$(cd "$app_dir" && pnpm test:unit 2>&1); then
			failed=1
			failed_check="test:unit"
			failed_output="$output"
			break
		fi
		echo "  ✓ test:unit"

		if ! output=$(cd "$app_dir" && pnpm e2e 2>&1); then
			failed=1
			failed_check="e2e"
			failed_output="$output"
			break
		fi
		echo "  ✓ e2e"
	done

	if [ $failed -eq 1 ]; then
		echo ""
		echo "┌──────────────────────────────────────────────────────────────┐"
		echo "│  CI FAILED: $failed_check"
		echo "└──────────────────────────────────────────────────────────────┘"
		FAILED_CHECK="$failed_check"
		FAILED_OUTPUT="$failed_output"
		FAILED_APP="$app_dir"
		return 1
	fi

	return 0
}

load_ci_state_context() {
	local build_status="Passes"
	local typecheck_status="Passes"
	local lint_status="Passes"
	local test_status="Passes"
	local e2e_status="Passes"
	local build_failures=""
	local typecheck_failures=""
	local lint_failures=""
	local test_failures=""
	local e2e_failures=""
	local app_dir=""
	local output=""

	for app_dir in $(get_app_dirs); do
		if ! output=$(cd "$app_dir" && pnpm build 2>&1); then
			build_status="Failed"
			build_failures="$build_failures
[$app_dir]
$output
"
		fi

		if ! output=$(cd "$app_dir" && pnpm typecheck 2>&1); then
			typecheck_status="Failed"
			typecheck_failures="$typecheck_failures
[$app_dir]
$output
"
		fi

		if ! output=$(cd "$app_dir" && pnpm lint 2>&1); then
			lint_status="Failed"
			lint_failures="$lint_failures
[$app_dir]
$output
"
		fi

		if ! output=$(cd "$app_dir" && pnpm test:unit 2>&1); then
			test_status="Failed"
			test_failures="$test_failures
[$app_dir]
$output
"
		fi

		if ! output=$(cd "$app_dir" && pnpm e2e 2>&1); then
			e2e_status="Failed"
			e2e_failures="$e2e_failures
[$app_dir]
$output
"
		fi
	done

	echo "Current Code Quality:"
	echo "Build: $build_status"
	echo "Typecheck: $typecheck_status"
	echo "Lint: $lint_status"
	echo "Test: $test_status"
	echo "E2E: $e2e_status"

	if [ "$build_status" = "Failed" ]; then
		echo ""
		echo "Build Failure Output:"
		echo "$build_failures"
	fi

	if [ "$typecheck_status" = "Failed" ]; then
		echo ""
		echo "Typecheck Failure Output:"
		echo "$typecheck_failures"
	fi

	if [ "$lint_status" = "Failed" ]; then
		echo ""
		echo "Lint Failure Output:"
		echo "$lint_failures"
	fi

	if [ "$test_status" = "Failed" ]; then
		echo ""
		echo "Test Failure Output:"
		echo "$test_failures"
	fi

	if [ "$e2e_status" = "Failed" ]; then
		echo ""
		echo "E2E Failure Output:"
		echo "$e2e_failures"
	fi
}

MAIN_PROMPT=$(<"$PROMPT_PATH")

for ((i = 1; i <= $ITERATIONS; i++)); do
	REMAINING=$(count_remaining)
	ELAPSED=$(($(date +%s) - START_TIME))
	ELAPSED_MIN=$((ELAPSED / 60))

	echo ""
	echo "┌──────────────────────────────────────────────────────────────┐"
	echo "│  Iteration $i/$ITERATIONS • Remaining: $REMAINING stories • ${ELAPSED_MIN}m elapsed"
	echo "└──────────────────────────────────────────────────────────────┘"
	echo ""

	BEFORE_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
	CI_STATE_CONTEXT=$(load_ci_state_context)

	RUN_PROMPT="$MAIN_PROMPT

## Current Code Quality

$CI_STATE_CONTEXT

Use this CI state as additional context. If a check is currently failing, prioritize fixing the relevant issues as part of this task when appropriate."

	opencode run "@tasks.json" "$RUN_PROMPT"

	AFTER_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")

	if [ "$BEFORE_SHA" == "$AFTER_SHA" ]; then
		echo ""
		echo "No commit made this iteration"
		read -p "Continue? (y/n) " -n 1 -r
		echo
		if [[ ! $REPLY =~ ^[Yy]$ ]]; then
			exit 0
		fi
		continue
	fi

	echo ""
	echo "┌──────────────────────────────────────────────────────────────┐"
	echo "│  RUNNING CI CHECKS (deterministic)                           │"
	echo "│  Order: typecheck -> lint -> test:unit -> e2e                │"
	echo "└──────────────────────────────────────────────────────────────┘"

	fix_attempt=0
	while [ $fix_attempt -lt $MAX_FIX_RETRIES ]; do
		FAILED_CHECK=""
		FAILED_OUTPUT=""
		FAILED_APP=""

		if run_ci_checks; then
			echo ""
			echo "All CI checks passed!"
			break
		fi

		fix_attempt=$((fix_attempt + 1))

		FIX_PROMPT="A CI check failed and must be fixed before continuing.

## Failed Check
- Check: $FAILED_CHECK
- Location: $FAILED_APP

## Error Output
$FAILED_OUTPUT

## Your Task
1. Analyze the error output above
2. Fix the issue that caused $FAILED_CHECK to fail
3. Do NOT commit yet - just fix the issue
4. After fixing, report what you changed"

		echo ""
		echo "┌──────────────────────────────────────────────────────────────┐"
		echo "│  FIXING: $FAILED_CHECK (attempt $fix_attempt/$MAX_FIX_RETRIES)"
		echo "└──────────────────────────────────────────────────────────────┘"

		opencode run "$FIX_PROMPT"

		if [ $fix_attempt -eq $MAX_FIX_RETRIES ]; then
			echo ""
			echo "╔════════════════════════════════════════════════════════════╗"
			echo "║              MAX FIX RETRIES EXCEEDED                       ║"
			echo "╠════════════════════════════════════════════════════════════╣"
			echo "║  Check:      $FAILED_CHECK"
			echo "║  Location:   $FAILED_APP"
			echo "║  Retries:    $MAX_FIX_RETRIES"
			echo "║  Manual intervention required"
			echo "╚════════════════════════════════════════════════════════════╝"
			exit 1
		fi
	done

	read -p "Continue to next iteration? (y/n) " -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		exit 0
	fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ITERATION LIMIT REACHED                        ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Completed: $ITERATIONS iterations"
echo "║  Remaining: $(count_remaining) stories"
echo "║  Run again with: aamini ralph $ITERATIONS"
echo "╚════════════════════════════════════════════════════════════╝"
