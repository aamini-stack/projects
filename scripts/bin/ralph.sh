#!/bin/bash
# ralph.sh - Autonomous Ralph loop with deterministic CI enforcement
# Usage: aamini ralph <task-id>
# Example: aamini ralph 1

set -e

corepack enable

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../.." && pwd))"
PROMPT_PATH="$SCRIPT_DIR/RALPH.md"

TARGET_TASK_ID="${1:-}"
START_TIME=$(date +%s)
MAX_FIX_RETRIES=5
RUN_E2E=false

if [ -z "$TARGET_TASK_ID" ]; then
	echo "Error: Task ID required"
	echo "Usage: aamini ralph <task-id>"
	echo "Example: aamini ralph 1"
	exit 1
fi

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

get_task_details() {
	local task_id="$1"
	node - "$task_id" <<'NODE'
const fs = require('fs');
const taskId = process.argv[2];
const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8')).tasks;
const task = tasks.find(t => t.id === taskId);
if (!task) {
	console.error(`Task ${taskId} not found`);
	process.exit(1);
}
console.log(JSON.stringify(task));
NODE
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

		if [ "$RUN_E2E" = "true" ]; then
			if ! run_pnpm_check "$app_dir" e2e; then
				failed=1
				failed_check="e2e"
				failed_output="$CHECK_OUTPUT"
				break
			fi
			echo "  ✓ e2e"
		fi
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

	set +e
	pnpm "${turbo_args[@]}" 2>&1 > "$turbo_output_file"
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
		echo "Code Quality: Unknown (turbo unavailable)"
		return
	fi

	node - "$summary_path" "$app_names_csv" <<'NODE'
const fs = require('fs')

const summaryPath = process.argv[2]
const appsCsv = process.argv[3] || ''

const appSet = new Set(appsCsv.split(',').filter(Boolean))
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))

const checks = [
	{ task: 'build', label: 'Build' },
	{ task: 'typecheck', label: 'Typecheck' },
	{ task: 'lint', label: 'Lint' },
	{ task: 'test:unit', label: 'Test' },
	{ task: 'e2e', label: 'E2E' },
]

const lines = []

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

process.stdout.write(`${lines.join('\n')}\n`)
NODE
}

get_git_log_since_main() {
	local main_branch="main"
	
	if ! git show-ref --verify --quiet "refs/heads/$main_branch" 2>/dev/null; then
		main_branch="master"
		if ! git show-ref --verify --quiet "refs/heads/$main_branch" 2>/dev/null; then
			echo "Git Log (base branch not found - showing last 5 commits):"
			git log --oneline -5
			return
		fi
	fi

	echo "Git Log since $main_branch:"
	git log "$main_branch..HEAD" --oneline --reverse
}

preflight_ci_fix() {
	fix_attempt=0
	while [ $fix_attempt -lt $MAX_FIX_RETRIES ]; do
		FAILED_CHECK=""
		FAILED_OUTPUT=""
		FAILED_APP=""

		if run_ci_checks; then
			echo ""
			echo "Pre-flight CI: All checks passed!"
			return 0
		fi

		fix_attempt=$((fix_attempt + 1))

		FIX_PROMPT="Pre-flight: A CI check failed and must be fixed before proceeding with tasks.

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
		echo "│  PRE-FLIGHT FIX: $FAILED_CHECK (attempt $fix_attempt/$MAX_FIX_RETRIES)"
		echo "└──────────────────────────────────────────────────────────────┘"

		opencode . --model opencode/minimax-m2.5-free --prompt "$FIX_PROMPT"

		if [ $fix_attempt -eq $MAX_FIX_RETRIES ]; then
			echo ""
			echo "╔════════════════════════════════════════════════════════════╗"
			echo "║              PRE-FLIGHT FIX FAILED                          ║"
			echo "╠════════════════════════════════════════════════════════════╣"
			echo "║  Check:      $FAILED_CHECK"
			echo "║  Location:   $FAILED_APP"
			echo "║  Retries:    $MAX_FIX_RETRIES"
			echo "║  Manual intervention required"
			echo "╚════════════════════════════════════════════════════════════╝"
			return 1
		fi
	done
}

postflight_ci_fix() {
	fix_attempt=0
	while [ $fix_attempt -lt $MAX_FIX_RETRIES ]; do
		FAILED_CHECK=""
		FAILED_OUTPUT=""
		FAILED_APP=""

		if run_ci_checks; then
			echo ""
			echo "Post-flight CI: All checks passed!"
			return 0
		fi

		fix_attempt=$((fix_attempt + 1))

		FIX_PROMPT="Post-flight: A CI check failed and must be fixed before continuing.

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
		echo "│  POST-FLIGHT FIX: $FAILED_CHECK (attempt $fix_attempt/$MAX_FIX_RETRIES)"
		echo "└──────────────────────────────────────────────────────────────┘"

		opencode . --model opencode/minimax-m2.5-free --prompt "$FIX_PROMPT"

		if [ $fix_attempt -eq $MAX_FIX_RETRIES ]; then
			echo ""
			echo "╔════════════════════════════════════════════════════════════╗"
			echo "║              POST-FLIGHT FIX FAILED                         ║"
			echo "╠════════════════════════════════════════════════════════════╣"
			echo "║  Check:      $FAILED_CHECK"
			echo "║  Location:   $FAILED_APP"
			echo "║  Retries:    $MAX_FIX_RETRIES"
			echo "║  Manual intervention required"
			echo "╚════════════════════════════════════════════════════════════╝"
			return 1
		fi
	done
}

parse_xml_output() {
	local xml_output="$1"
	
	local task_id status summary files_changed ci_results commit_sha notes
	
	task_id=$(echo "$xml_output" | sed -n 's/.*<task_id>\([^<]*\)<\/task_id>.*/\1/p')
	status=$(echo "$xml_output" | sed -n 's/.*<status>\([^<]*\)<\/status>.*/\1/p')
	summary=$(echo "$xml_output" | sed -n 's/.*<summary>\([^<]*\)<\/summary>.*/\1/p')
	files_changed=$(echo "$xml_output" | sed -n 's/.*<files_changed>\([^<]*\)<\/files_changed>.*/\1/p')
	ci_results=$(echo "$xml_output" | sed -n 's/.*<ci_results>\([^<]*\)<\/ci_results>.*/\1/p')
	commit_sha=$(echo "$xml_output" | sed -n 's/.*<commit_sha>\([^<]*\)<\/commit_sha>.*/\1/p')
	notes=$(echo "$xml_output" | sed -n 's/.*<notes>\([^<]*\)<\/notes>.*/\1/p')
	
	if [ -z "$task_id" ]; then
		echo "Error: Missing <task_id> in output"
		return 1
	fi
	
	if [ -z "$status" ]; then
		echo "Error: Missing <status> in output"
		return 1
	fi
	
	if [ "$status" = "done" ]; then
		if [ -z "$commit_sha" ]; then
			echo "Error: Missing <commit_sha> for status 'done'"
			return 1
		fi
	fi
	
	PARSED_TASK_ID="$task_id"
	PARSED_STATUS="$status"
	PARSED_SUMMARY="$summary"
	PARSED_FILES_CHANGED="$files_changed"
	PARSED_CI_RESULTS="$ci_results"
	PARSED_COMMIT_SHA="$commit_sha"
	PARSED_NOTES="$notes"
	
	return 0
}

update_tasks_json() {
	local task_id="$1"
	local status="$2"
	local commit_sha="$3"
	local notes="$4"
	
	node - "$task_id" "$status" "$commit_sha" "$notes" <<'NODE'
const fs = require('fs');
const taskId = process.argv[2];
const status = process.argv[3];
const commitSha = process.argv[4] || '';
const notes = process.argv[5] || '';

const data = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
const task = data.tasks.find(t => t.id === taskId);

if (!task) {
	console.error(`Task ${taskId} not found`);
	process.exit(1);
}

if (status === 'done') {
	task.done = true;
	task.blocked = false;
	task.commitSha = commitSha;
	task.notes = notes;
} else if (status === 'blocked') {
	task.blocked = true;
	task.done = false;
	task.notes = notes;
}

fs.writeFileSync('tasks.json', JSON.stringify(data, null, 2) + '\n');
console.log(`Updated task ${taskId}: status=${status}, commit=${commitSha || 'N/A'}`);
NODE
}

MAIN_PROMPT=$(<"$PROMPT_PATH")

CI_STATE_CONTEXT=$(load_ci_state_context)
GIT_LOG_CONTEXT=$(get_git_log_since_main)

TASK_JSON=$(get_task_details "$TARGET_TASK_ID")
if [ $? -ne 0 ]; then
	echo "Error: Could not find task $TARGET_TASK_ID in tasks.json"
	exit 1
fi

TASK_DESCRIPTION=$(node - "$TASK_JSON" <<'NODE'
const task = JSON.parse(process.argv[2]);
const lines = [
	`ID: ${task.id}`,
	`Title: ${task.title}`,
	'',
	'Description:',
	task.description,
	'',
	'TODO:',
	...task.todo.map((item, i) => `${i + 1}. ${item}`),
	'',
	'Dependencies:',
	...task.dependencies.length > 0 ? task.dependencies : ['None'],
];
console.log(lines.join('\n'));
NODE
)

MAIN_PROMPT="${MAIN_PROMPT//\$\{TASK_ID\}/$TARGET_TASK_ID}"
MAIN_PROMPT="${MAIN_PROMPT//\{TASK DESCRIPTION\}/$TASK_DESCRIPTION}"
MAIN_PROMPT="${MAIN_PROMPT//\{TASK STATUS\}/$CI_STATE_CONTEXT}"

echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  PRE-FLIGHT CHECKS                                          │"
echo "└──────────────────────────────────────────────────────────────┘"

echo "Checking code quality..."
CI_STATE_CONTEXT=$(load_ci_state_context 2>/dev/null)

echo "$CI_STATE_CONTEXT"
echo ""
echo "$GIT_LOG_CONTEXT"

if echo "$CI_STATE_CONTEXT" | grep -qE "(Build|Typecheck|Lint|Test): Failed"; then
	echo ""
	echo "Pre-flight CI failed. Attempting to fix..."
	if ! preflight_ci_fix; then
		echo "Pre-flight fix failed. Exiting."
		exit 1
	fi
else
	echo ""
	echo "Pre-flight CI: Already passing ✓"
fi

BEFORE_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")

RUN_PROMPT="$MAIN_PROMPT

## Git Log Since Main

$GIT_LOG_CONTEXT

## Instructions

1. If CI is currently failing (shown above), prioritize fixing the relevant issues as part of this task when appropriate.
2. Implement the task described above.
3. After implementation, output your results in the required XML format."

opencode . --model opencode/minimax-m2.5-free --prompt "@tasks.json

$RUN_PROMPT"

AFTER_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")

if [ "$BEFORE_SHA" != "$AFTER_SHA" ]; then
	echo ""
	if [ "$RUN_E2E" = "true" ]; then
		echo "┌──────────────────────────────────────────────────────────────┐"
		echo "│  POST-FLIGHT CI CHECKS                                       │"
		echo "│  Order: typecheck -> lint -> test:unit -> e2e               │"
		echo "└──────────────────────────────────────────────────────────────┘"
	else
		echo "┌──────────────────────────────────────────────────────────────┐"
		echo "│  POST-FLIGHT CI CHECKS                                       │"
		echo "│  Order: typecheck -> lint -> test:unit                      │"
		echo "└──────────────────────────────────────────────────────────────┘"
	fi

	if ! postflight_ci_fix; then
		echo "Post-flight fix failed. Manual intervention required."
		exit 1
	fi
	
	AFTER_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")
fi

echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  PARSING OUTPUT                                            │"
echo "└──────────────────────────────────────────────────────────────┘"

LLM_RESPONSE=$(cat)

if ! parse_xml_output "$LLM_RESPONSE"; then
	echo ""
	echo "Failed to parse XML output from LLM"
	echo ""
	echo "Output received:"
	echo "$LLM_RESPONSE"
	exit 1
fi

echo "Parsed: task_id=$PARSED_TASK_ID, status=$PARSED_STATUS, commit=$PARSED_COMMIT_SHA"

if [ "$PARSED_STATUS" = "failed" ]; then
	echo ""
	echo "╔════════════════════════════════════════════════════════════╗"
	echo "║              LLM REPORTED FAILED                           ║"
	echo "╠════════════════════════════════════════════════════════════╣"
	echo "║  Summary: $PARSED_SUMMARY"
	echo "║  Files:   $PARSED_FILES_CHANGED"
	echo "╚════════════════════════════════════════════════════════════╝"
	exit 1
fi

update_tasks_json "$PARSED_TASK_ID" "$PARSED_STATUS" "$PARSED_COMMIT_SHA" "$PARSED_NOTES"

if [ "$PARSED_STATUS" = "blocked" ]; then
	echo ""
	echo "╔════════════════════════════════════════════════════════════╗"
	echo "║              TASK BLOCKED                                  ║"
	echo "╠════════════════════════════════════════════════════════════╣"
	echo "║  Task:     $PARSED_TASK_ID"
	echo "║  Notes:    $PARSED_NOTES"
	echo "╚════════════════════════════════════════════════════════════╝"
	exit 0
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              TASK COMPLETED                                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Task:     $PARSED_TASK_ID"
echo "║  Commit:   $PARSED_COMMIT_SHA"
echo "║  Notes:    $PARSED_NOTES"
echo "╚════════════════════════════════════════════════════════════╝"

read -p "Continue to next task? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	exit 0
fi
