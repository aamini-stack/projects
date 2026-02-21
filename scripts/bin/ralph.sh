#!/bin/bash
# ralph.sh - Autonomous Ralph loop with deterministic CI enforcement
# Usage: ./scripts/ralph.sh [iterations]
# Example: ./scripts/ralph.sh 50

set -e

corepack enable

ITERATIONS=${1:-20}
START_TIME=$(date +%s)
MAX_FIX_RETRIES=5

if [ ! -f "tasks.json" ]; then
	echo "Error: tasks.json not found in current directory"
	echo "Create tasks.json with your stories before running Ralph"
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
	find apps -maxdepth 1 -mindepth 1 -type d | head -20
}

run_ci_checks() {
	local failed=0
	local failed_check=""
	local failed_output=""
	local app_dir=""

	for app_dir in $(get_app_dirs); do
		if [ ! -f "$app_dir/package.json" ]; then
			continue
		fi

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

MAIN_PROMPT="You are an autonomous agent working on a single story from tasks.json.

## Project Manager (pm) CLI

Query and manage tasks.json for autonomous workflows:

| Command                        | Action                                                            |
| :----------------------------- | :---------------------------------------------------------------- |
| $(pm next)                      | Show next available tasks (topological order)                     |
| $(pm show $id)                 | Show details for a story (e.g., pm show 1.1)                      |

## Pre-flight Check

1. BEFORE starting any work, run pnpm verify in the relevant app directory
2. If tests fail, STOP and report the failures - do not proceed with new work
3. Only proceed if all tests pass

## Find Your Task

1. Read tasks.json
2. Find the NEXT available story where: done is false AND ALL dependencies have done: true
3. If multiple available, pick by: epic order then story order

## Implement the Story

1. Complete ALL items in the story's todo array
2. Work ONLY on this single story - do not touch other stories
3. Run pnpm verify in the relevant app directory after implementing

## Commit

Format: feat(scope): story X.Y - Title
- Get scope from epic title (lowercase, hyphenated)
- Example: Epic 'User Dashboard' -> scope 'user-dashboard'

## Update tasks.json

After successful commit:
- Set done: true
- Set commitSha to output of git rev-parse HEAD
- Add any notes about implementation decisions

## Completion Signal

If NO stories are available (all done OR no stories with met dependencies):
- Output EXACTLY: <ralph>COMPLETE</ralph>
- Otherwise, NEVER output this signal

## Critical Rules

- Run pnpm verify BEFORE and AFTER implementing
- ONE story per iteration - ALWAYS
- Never mark done without a commit
- Never work on a story with unmet dependencies"

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

	opencode run "@tasks.json" "$MAIN_PROMPT"

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
echo "║  Run again with: ./scripts/ralph.sh $ITERATIONS"
echo "╚════════════════════════════════════════════════════════════╝"
