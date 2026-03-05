#!/usr/bin/env node
import * as fs from 'node:fs'
import * as path from 'node:path'
import { $ } from 'zx'

interface Task {
	id: string
	title: string
	description: string
	todo: string[]
	dependencies: string[]
	commitSha: string | null
	done: boolean
	blocked: boolean
	notes: string
}

interface RawTask {
	id: unknown
	title: unknown
	description: unknown
	todo?: unknown
	dependencies?: unknown
	commitSha?: unknown
	done?: unknown
	blocked?: unknown
	notes?: unknown
	'acceptance-criteria'?: unknown
}

type TasksFile = { tasks: RawTask[] } | RawTask[]

interface PromptData {
	template: string
	task: Pick<Task, 'id' | 'title' | 'description' | 'todo' | 'dependencies'>
	ciOutput: string
	gitLog: string
}

interface ShellResult {
	stdout: string
	stderr: string
	exitCode: number
	ok: boolean
}

interface RalphShell {
	getRepoRoot(): Promise<string | null>
	branchExists(repoRoot: string, branch: string): Promise<boolean>
	gitLogRange(repoRoot: string, range: string): Promise<string>
	gitLogRecent(repoRoot: string, count: number): Promise<string>
	runCheck(repoRoot: string, app: string, check: string): Promise<ShellResult>
	runOpencode(prompt: string): Promise<void>
	continueOpencode(): Promise<void>
}

const MAX_FIX_RETRIES = 5
const SECTION_LINE = '='.repeat(68)
const SUBSECTION_LINE = '-'.repeat(68)
const CHECKS = ['typecheck', 'lint', 'test:unit'] as const
const RALPH_PROMPT_TEMPLATE = `# Ralph Loop

You are an autonomous agent working on a large feature described in @PLAN.md and
with subtasks broken down in @tasks.json. You have been assigned a singular task
from tasks.json to implement. Your job is to implement that task and that task
ONLY. Below will be context and information about the task.

## Task {{TASK_ID}}: {{TASK_TITLE}}

{{TASK_DESCRIPTION}}

TODO:
{{TASK_TODO}}

Dependencies:
{{TASK_DEPENDENCIES}}

## Code Quality Status

Pre-flight checks are intentionally skipped by the runner for speed. If you hit
an error while implementing, run only the relevant targeted check first.
Run full verification only once at the end.

{{TASK_STATUS}}

## Git Log Since Main

{{GIT_LOG_CONTEXT}}

## Instructions

1. If you discover CI issues while implementing, prioritize fixing the relevant issues as part of this task when appropriate.
2. Implement the task described above.
3. After implementation, output your results in the required JSON format.

## Pre-flight checks

- Never work on more than one task per iteration.
- Never modify unrelated tasks in tasks.json.
- Never mark a task done without a real commit SHA.
- Keep changes scoped and deterministic.
- If pre-flight CI was failing, prioritize fixing those issues.
- Verify changes work through manual testing or new automated tests.

## Post-Flight checks

- Have all changes commited and have the SHA of that commit ready.
- Run one final set of code quality checks 'pnpm verify'.
- Do any final manual checks to make sure everything is working.
- Mark the task as explained in the next section done.

## Output Format (Strict)

To mark the task complete, run this aamini pm command:

\`\`\`bash
aamini pm done <<EOF
{
  "task": {{TASK_ID}},
  "status": "done",
  "sha": "<commit-sha>",
  "notes": "<summary>"
}
EOF
\`\`\`

Note: For "blocked" status, sha is optional.

\`\`\`bash
aamini pm done <<EOF
{
  "task": 1,
  "status": "done",
  "sha": "9b6b30bf9f5cceb8d2b9a5e5334fc22148fb093f",
  "summary": "Added new /login endpoint",
  "notes": "Wrote unit tests and performed manual and verified all tests using 'pnpm verify'"
}
EOF
\`\`\`

\`\`\`bash
aamini pm done <<EOF
{
  "task": 1,
  "status": "blocked",
  "summary": "Could not run commands",
  "notes": "Did not have permission to run 'pnpm i'"
}
EOF
\`\`\`
`
const RALPH_CI_FIX_TEMPLATE = `CI check failed and must be fixed.

## Failed Check

- App: {{FAILED_APP}}
- Check: {{FAILED_CHECK}}

## Error Output

{{ERROR_OUTPUT}}

## Your Task

1. Analyze the error output above
2. Fix the issue that caused the failure
3. Do NOT commit yet - just fix the issue
4. Run only the failed check ('pnpm --filter {{FAILED_APP}} {{FAILED_CHECK}}') to verify the fix quickly
5. Run 'pnpm verify' only once at the very end before marking the task done
`

type RalphLogger = Pick<Console, 'log' | 'error'>

interface CIResult {
	app: string
	check: string
	passed: boolean
	output: string
}

interface RunRalphOptions {
	taskId: string
	repoRoot?: string
	shell?: RalphShell
	logger?: RalphLogger
	maxFixRetries?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}

	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}

function parseTasks(rawJson: string): Task[] {
	const parsed = JSON.parse(rawJson) as TasksFile

	const rawTasks = Array.isArray(parsed)
		? parsed
		: Array.isArray(parsed.tasks)
			? parsed.tasks
			: null

	if (!rawTasks) {
		throw new Error(
			'tasks.json must be an array or an object with a tasks array',
		)
	}

	return rawTasks.map((rawTask, index) => {
		if (!isRecord(rawTask)) {
			throw new Error(`Invalid task at index ${index}`)
		}

		const title = typeof rawTask.title === 'string' ? rawTask.title.trim() : ''
		const description =
			typeof rawTask.description === 'string' ? rawTask.description.trim() : ''
		const id = String(rawTask.id ?? '').trim()

		if (!id || !title || !description) {
			throw new Error(
				`Task at index ${index} is missing id, title, or description`,
			)
		}

		const todo = toStringArray(rawTask.todo)
		const acceptanceCriteria = toStringArray(rawTask['acceptance-criteria'])

		return {
			id,
			title,
			description,
			todo: todo.length > 0 ? todo : acceptanceCriteria,
			dependencies: toStringArray(rawTask.dependencies),
			commitSha:
				typeof rawTask.commitSha === 'string' ? rawTask.commitSha : null,
			done: typeof rawTask.done === 'boolean' ? rawTask.done : false,
			blocked: typeof rawTask.blocked === 'boolean' ? rawTask.blocked : false,
			notes: typeof rawTask.notes === 'string' ? rawTask.notes : '',
		}
	})
}

function createZxShell(): RalphShell {
	const quietResult = async (
		cwd: string,
		run: (shell: any) => Promise<unknown>,
	): Promise<ShellResult> => {
		const shell = $({ cwd, nothrow: true, stdio: 'pipe' })
		const output = (await run(shell)) as {
			stdout: string
			stderr: string
			exitCode: number
		}
		return {
			stdout: output.stdout,
			stderr: output.stderr,
			exitCode: output.exitCode,
			ok: output.exitCode === 0,
		}
	}

	return {
		async getRepoRoot(): Promise<string | null> {
			const result = await quietResult(
				process.cwd(),
				(zx$) => zx$`git rev-parse --show-toplevel`,
			)
			const repoRoot = result.stdout.trim()
			return result.ok && repoRoot ? repoRoot : null
		},
		async branchExists(repoRoot: string, branch: string): Promise<boolean> {
			const result = await quietResult(
				repoRoot,
				(zx$) => zx$`git show-ref --verify --quiet refs/heads/${branch}`,
			)
			return result.ok
		},
		async gitLogRange(repoRoot: string, range: string): Promise<string> {
			const result = await quietResult(
				repoRoot,
				(zx$) => zx$`git log ${range} --oneline --reverse`,
			)
			return result.stdout
		},
		async gitLogRecent(repoRoot: string, count: number): Promise<string> {
			const result = await quietResult(
				repoRoot,
				(zx$) => zx$`git log --oneline -${count}`,
			)
			return result.stdout
		},
		async runCheck(
			repoRoot: string,
			app: string,
			check: string,
		): Promise<ShellResult> {
			return quietResult(repoRoot, (zx$) => zx$`pnpm --filter ${app} ${check}`)
		},
		async runOpencode(prompt: string): Promise<void> {
			const interactive = $({ stdio: 'inherit' })
			await interactive`opencode . --prompt ${prompt}`
		},
		async continueOpencode(): Promise<void> {
			const interactive = $({ stdio: 'inherit' })
			await interactive`opencode . --continue`
		},
	}
}

function renderResults(results: CIResult[], logger: RalphLogger): void {
	if (results.length === 0) {
		logger.log('  [none]')
		return
	}

	const maxAppLen = Math.max(...results.map((r) => r.app.length))
	const maxCheckLen = Math.max(...results.map((r) => r.check.length))

	logger.log()
	for (const result of results) {
		const status = result.passed ? 'OK' : 'FAIL'
		const appPad = result.app.padEnd(maxAppLen)
		const checkPad = result.check.padEnd(maxCheckLen)
		logger.log(`  [${status}] ${appPad} ${checkPad}`)
	}
	logger.log(SUBSECTION_LINE)
}

async function getRepoRoot(shell: RalphShell): Promise<string> {
	return (await shell.getRepoRoot()) ?? process.cwd()
}

async function getGitLog(repoRoot: string, shell: RalphShell): Promise<string> {
	for (const branch of ['main', 'master']) {
		const exists = await shell.branchExists(repoRoot, branch)
		if (!exists) {
			continue
		}

		const log = await shell.gitLogRange(repoRoot, `${branch}..HEAD`)
		return `Git Log since ${branch}:\n${log.trim() || 'No new commits'}`
	}

	const recent = await shell.gitLogRecent(repoRoot, 5)
	return `Git Log (base branch not found):\n${recent.trim()}`
}

function runCI(
	repoRoot: string,
	shell: RalphShell,
): Promise<{ passed: boolean; results: CIResult[] }> {
	const appsDir = path.join(repoRoot, 'apps')

	if (!fs.existsSync(appsDir)) {
		return Promise.resolve({ passed: true, results: [] })
	}

	const appDirs = fs.readdirSync(appsDir).filter((name) => {
		const pkgPath = path.join(appsDir, name, 'package.json')
		return fs.existsSync(pkgPath)
	})

	return (async () => {
		const results: CIResult[] = []

		for (const app of appDirs) {
			for (const check of CHECKS) {
				const result = await shell.runCheck(repoRoot, app, check)
				results.push({
					app,
					check,
					passed: result.ok,
					output: result.stderr || result.stdout,
				})
			}
		}

		return {
			passed: results.every((result) => result.passed),
			results,
		}
	})()
}

function generatePrompt(data: PromptData): string {
	const taskTodo = data.task.todo
		.map((item, index) => `${index + 1}. ${item}`)
		.join('\n')
	const taskDependencies =
		data.task.dependencies.length > 0
			? data.task.dependencies.join('\n')
			: 'None'

	let prompt = data.template
	prompt = prompt.split('{{TASK_ID}}').join(data.task.id)
	prompt = prompt.split('{{TASK_TITLE}}').join(data.task.title)
	prompt = prompt.split('{{TASK_DESCRIPTION}}').join(data.task.description)
	prompt = prompt.split('{{TASK_TODO}}').join(taskTodo)
	prompt = prompt.split('{{TASK_DEPENDENCIES}}').join(taskDependencies)
	prompt = prompt.split('{{TASK_STATUS}}').join(data.ciOutput)
	prompt = prompt.split('{{GIT_LOG_CONTEXT}}').join(data.gitLog)

	return prompt
}

async function fixCILoop(options: {
	repoRoot: string
	shell: RalphShell
	logger: RalphLogger
	maxFixRetries: number
}): Promise<boolean> {
	const { repoRoot, shell, logger, maxFixRetries } = options

	logger.log(`\n${SECTION_LINE}`)
	logger.log('CI AUTO-FIX LOOP')
	logger.log(`${SECTION_LINE}\n`)

	let attempt = 0
	while (attempt < maxFixRetries) {
		attempt++

		const ci = await runCI(repoRoot, shell)
		if (ci.passed) {
			logger.log(`${SUBSECTION_LINE}`)
			logger.log('CI: All checks passed!')
			logger.log(SUBSECTION_LINE)
			return true
		}

		logger.log(`${SUBSECTION_LINE}`)
		logger.log(`CI: Failed (attempt ${attempt}/${maxFixRetries})`)
		renderResults(ci.results, logger)

		const firstFailure = ci.results.find((result) => !result.passed)
		if (!firstFailure) {
			continue
		}

		const fixPrompt = RALPH_CI_FIX_TEMPLATE.split('{{FAILED_APP}}')
			.join(firstFailure.app)
			.split('{{FAILED_CHECK}}')
			.join(firstFailure.check)
			.split('{{ERROR_OUTPUT}}')
			.join(firstFailure.output.slice(0, 2000))

		try {
			await shell.runOpencode(fixPrompt)
		} catch (error) {
			logger.error('opencode error:', error)
		}
	}

	logger.log(`\n${SECTION_LINE}`)
	logger.log('CI AUTO-FIX FAILED')
	logger.log('Manual intervention required')
	logger.log(SECTION_LINE)
	return false
}

async function runRalph(options: RunRalphOptions): Promise<void> {
	const shell = options.shell ?? createZxShell()
	const logger = options.logger ?? console
	const maxFixRetries = options.maxFixRetries ?? MAX_FIX_RETRIES

	const repoRoot = options.repoRoot ?? (await getRepoRoot(shell))

	logger.log(`\n${SECTION_LINE}`)
	logger.log('RALPH PRE-FLIGHT')
	logger.log(SECTION_LINE)

	const tasksPath = path.join(repoRoot, 'tasks.json')
	if (!fs.existsSync(tasksPath)) {
		throw new Error('tasks.json not found in current directory')
	}

	const tasks = parseTasks(fs.readFileSync(tasksPath, 'utf8'))
	const task = tasks.find((candidate) => candidate.id === options.taskId)
	if (!task) {
		throw new Error(`Task ${options.taskId} not found in tasks.json`)
	}

	const gitLog = await getGitLog(repoRoot, shell)

	const prompt = generatePrompt({
		template: RALPH_PROMPT_TEMPLATE,
		task,
		ciOutput: 'Pre-flight checks skipped by runner',
		gitLog,
	})

	logger.log(`\n${SECTION_LINE}`)
	logger.log(`RALPH RUN: TASK ${task.id}`)
	logger.log(SECTION_LINE)

	await shell.runOpencode(prompt)

	logger.log(`\n${SECTION_LINE}`)
	logger.log('RALPH POST-FLIGHT')
	logger.log(SECTION_LINE)

	const postCi = await runCI(repoRoot, shell)
	if (!postCi.passed) {
		renderResults(postCi.results, logger)

		const fixed = await fixCILoop({
			repoRoot,
			shell,
			logger,
			maxFixRetries,
		})

		if (!fixed) {
			throw new Error(`CI fix failed. Run: aamini ralph ${task.id}`)
		}
	}

	logger.log(`\n${SECTION_LINE}`)
	logger.log('RALPH COMPLETE')
	logger.log(SECTION_LINE)
}

async function main(): Promise<void> {
	const taskId = process.argv.slice(2)[0]

	if (!taskId) {
		console.error('Error: Task ID required')
		console.error('Usage: aamini ralph <task-id>')
		console.error('Example: aamini ralph 1')
		process.exitCode = 1
		return
	}

	try {
		await runRalph({ taskId })
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
		} else {
			console.error('Error:', error)
		}
		process.exitCode = 1
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}

export { generatePrompt, getGitLog, getRepoRoot, main, runCI, runRalph }
export type {
	CIResult,
	PromptData,
	RalphShell,
	RunRalphOptions,
	ShellResult,
	Task,
	TasksFile,
}
