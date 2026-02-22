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
MAX_FAILURE_LINES=12

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

get_app_names() {
	local app_dir=""
	for app_dir in $(get_app_dirs); do
		basename "$app_dir"
	done
}

run_pnpm_check() {
	local app_dir="$1"
	local command_name="$2"
	local stream_fd="${3:-1}"
	local tmp_output
	tmp_output=$(mktemp)

	if [ "$stream_fd" = "2" ]; then
		(
			cd "$app_dir" && pnpm "$command_name"
		) 2>&1 | tee "$tmp_output" >&2
	else
		(
			cd "$app_dir" && pnpm "$command_name"
		) 2>&1 | tee "$tmp_output"
	fi

	local status=${PIPESTATUS[0]}
	CHECK_OUTPUT=$(cat "$tmp_output")
	rm -f "$tmp_output"

	return $status
}

run_ci_checks() {
	local failed=0
	local failed_check=""
	local failed_output=""
	local app_dir=""

	for app_dir in $(get_app_dirs); do

		echo ""
		echo "Checking $app_dir..."

		if ! run_pnpm_check "$app_dir" typecheck; then
			failed=1
			failed_check="typecheck"
			failed_output="$CHECK_OUTPUT"
			break
		fi
		echo "  ✓ typecheck"

		if ! run_pnpm_check "$app_dir" lint; then
			failed=1
			failed_check="lint"
			failed_output="$CHECK_OUTPUT"
			break
		fi
		echo "  ✓ lint"

		if ! run_pnpm_check "$app_dir" test:unit; then
			failed=1
			failed_check="test:unit"
			failed_output="$CHECK_OUTPUT"
			break
		fi
		echo "  ✓ test:unit"

		if ! run_pnpm_check "$app_dir" e2e; then
			failed=1
			failed_check="e2e"
			failed_output="$CHECK_OUTPUT"
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
	local app_names_csv
	app_names_csv=$(get_app_names | paste -sd ',' -)

	if [ -z "$app_names_csv" ]; then
		echo "Current Code Quality:"
		echo "Apps scoped: 0"
		echo "Build: Unknown"
		echo "Typecheck: Unknown"
		echo "Lint: Unknown"
		echo "Test: Unknown"
		echo "E2E: Unknown"
		return
	fi

	local turbo_output_file
	turbo_output_file=$(mktemp)

	local turbo_args=(
		turbo run build typecheck lint test:unit e2e
		--summarize
		--continue=always
		--output-logs=errors-only
		--log-order=grouped
		--concurrency=1
	)

	local app_name=""
	for app_name in $(get_app_names); do
		turbo_args+=(--filter="$app_name")
	done

	echo "" >&2
	echo "Collecting CI state snapshot via turbo --summarize..." >&2

	set +e
	pnpm "${turbo_args[@]}" 2>&1 | tee "$turbo_output_file" >&2
	local turbo_exit=${PIPESTATUS[0]}
	set -e

	local summary_path
	summary_path=$(node -e '
		const fs = require("fs")
		const text = fs.readFileSync(process.argv[1], "utf8")
		const matches = [...text.matchAll(/Summary:\s+([^\s]+)/g)]
		if (matches.length === 0) process.exit(0)
		process.stdout.write(matches[matches.length - 1][1])
	' "$turbo_output_file")

	rm -f "$turbo_output_file"

	if [ -z "$summary_path" ] || [ ! -f "$summary_path" ]; then
		echo "Current Code Quality:"
		echo "Apps scoped: $(echo "$app_names_csv" | tr ',' '\n' | wc -l | tr -d ' ')"
		echo "Build: Unknown"
		echo "Typecheck: Unknown"
		echo "Lint: Unknown"
		echo "Test: Unknown"
		echo "E2E: Unknown"
		echo ""
		echo "Turbo summary missing. Turbo exit code: $turbo_exit"
		return
	fi

	node - "$summary_path" "$REPO_ROOT" "$app_names_csv" "$MAX_FAILURE_LINES" <<'NODE'
const fs = require('fs')
const path = require('path')

const summaryPath = process.argv[2]
const repoRoot = process.argv[3]
const appsCsv = process.argv[4] || ''
const maxFailureLines = Number(process.argv[5] || '12')

const appSet = new Set(appsCsv.split(',').filter(Boolean))
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))

const checks = [
	{ task: 'build', label: 'Build' },
	{ task: 'typecheck', label: 'Typecheck' },
	{ task: 'lint', label: 'Lint' },
	{ task: 'test:unit', label: 'Test' },
	{ task: 'e2e', label: 'E2E' },
]

const lines = [
	'Current Code Quality:',
	`Apps scoped: ${appSet.size}`,
	`Turbo summary: ${path.relative(repoRoot, summaryPath)}`,
]

for (const check of checks) {
	const tasks = (summary.tasks || []).filter(
		(task) => appSet.has(task.package) && task.task === check.task,
	)
	if (tasks.length === 0) {
		lines.push(`${check.label}: Unknown`)
		continue
	}
	const failed = tasks.filter((task) => (task.execution?.exitCode ?? 0) !== 0)
	if (failed.length > 0) {
		lines.push(`${check.label}: Failed (${failed.length}/${tasks.length})`)
	} else {
		lines.push(`${check.label}: Passes (${tasks.length}/${tasks.length})`)
	}
}

for (const check of checks) {
	const failedTasks = (summary.tasks || []).filter(
		(task) =>
			appSet.has(task.package) &&
			task.task === check.task &&
			(task.execution?.exitCode ?? 0) !== 0,
	)
	if (failedTasks.length === 0) continue

	lines.push('')
	lines.push(`${check.label} Failures:`)

	for (const task of failedTasks.slice(0, 3)) {
		lines.push(`- ${task.package} (${task.taskId})`)
		const logFile = task.logFile ? path.join(repoRoot, task.logFile) : null
		if (!logFile || !fs.existsSync(logFile)) {
			lines.push('  No log output found')
			continue
		}

		const raw = fs.readFileSync(logFile, 'utf8')
		const snippets = raw
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
			.slice(-maxFailureLines)
			.map((line) => (line.length > 220 ? `${line.slice(0, 220)}...` : line))

		if (snippets.length === 0) {
			lines.push('  No log output found')
		} else {
			for (const snippet of snippets) {
				lines.push(`  ${snippet}`)
			}
		}
	}
}

process.stdout.write(`${lines.join('\n')}\n`)
NODE
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
