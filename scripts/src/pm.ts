#!/usr/bin/env node
import { cac } from 'cac'
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

interface TasksFile {
	tasks: Task[]
}

function getRepoRoot(): string {
	let current = path.resolve(process.cwd())

	while (true) {
		if (fs.existsSync(path.join(current, '.git'))) {
			return current
		}

		const parent = path.dirname(current)
		if (parent === current) {
			return process.cwd()
		}

		current = parent
	}
}

const TASKS_PATH = path.resolve(getRepoRoot(), 'tasks.json')

function loadTasks(): TasksFile {
	if (!fs.existsSync(TASKS_PATH)) {
		console.error('Error: tasks.json not found in current directory')
		process.exit(1)
	}
	return JSON.parse(fs.readFileSync(TASKS_PATH, 'utf-8'))
}

function saveTasks(tasks: TasksFile): void {
	fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, '\t') + '\n')
}

function getTaskById(tasks: TasksFile, id: string): Task | undefined {
	return tasks.tasks.find((t) => t.id === id)
}

function areDependenciesMet(tasks: TasksFile, task: Task): boolean {
	return task.dependencies.every((depId) => {
		const dep = getTaskById(tasks, depId)
		return dep?.done === true
	})
}

function getNextTasks(tasks: TasksFile): Task[] {
	return tasks.tasks.filter(
		(task) => !task.done && areDependenciesMet(tasks, task),
	)
}

function wipeAllProgress(tasks: TasksFile): number {
	for (const task of tasks.tasks) {
		task.done = false
		task.commitSha = null
		task.notes = ''
	}
	return tasks.tasks.length
}

function getProgress(tasks: TasksFile): {
	completed: number
	total: number
	remaining: number
} {
	const total = tasks.tasks.length
	const completed = tasks.tasks.filter((task) => task.done).length
	return {
		completed,
		total,
		remaining: total - completed,
	}
}

function cmdNext(): void {
	const tasks = loadTasks()
	const next = getNextTasks(tasks)

	if (next.length === 0) {
		console.log(
			'No available tasks. All tasks are done or have unmet dependencies.',
		)
		return
	}

	console.log('Next available tasks:\n')
	for (const task of next) {
		console.log(`  ${task.id}: ${task.title}`)
	}
}

function cmdShow(id: string): void {
	const tasks = loadTasks()
	const task = getTaskById(tasks, id)

	if (!task) {
		console.error(`Error: Task ${id} not found`)
		process.exit(1)
	}

	console.log(`\n  ${task.id}: ${task.title}`)
	console.log('  ─'.repeat(30))
	console.log(`  Description: ${task.description}`)
	console.log(`  Done: ${task.done}`)
	console.log(
		`  Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'none'}`,
	)
	console.log(`  Commit: ${task.commitSha || 'none'}`)
	console.log(`  Todo:`)
	for (const item of task.todo) {
		console.log(`    - ${item}`)
	}
	if (task.notes) {
		console.log(`  Notes: ${task.notes}`)
	}
	console.log()
}

function cmdUpdate(id: string, field: string, value: string): void {
	const tasks = loadTasks()
	const task = getTaskById(tasks, id)

	if (!task) {
		console.error(`Error: Task ${id} not found`)
		process.exit(1)
	}

	if (field === 'done') {
		task.done = value === 'true'
	} else if (field === 'notes') {
		task.notes = value
	} else if (field === 'commitSha') {
		task.commitSha = value
	} else if (field === 'title') {
		task.title = value
	} else if (field === 'description') {
		task.description = value
	} else if (field in task) {
		console.error(`Error: Cannot update field '${field}' directly`)
		process.exit(1)
	} else {
		console.error(`Error: Unknown field '${field}'`)
		process.exit(1)
	}

	saveTasks(tasks)
	console.log(`Updated ${id}.${field} = ${value}`)
}

function cmdDone(id: string, commitSha: string, notes: string): void {
	const tasks = loadTasks()
	const task = getTaskById(tasks, id)

	if (!task) {
		console.error(`Error: Task ${id} not found`)
		process.exit(1)
	}

	task.done = true
	task.blocked = false
	task.commitSha = commitSha
	task.notes = notes

	saveTasks(tasks)
	console.log(`Marked task ${id} as done (commit: ${commitSha})`)
}

interface DonePayload {
	task: number | string
	status: 'done' | 'blocked' | 'failed'
	sha?: string
	summary?: string
	notes?: string
}

function cmdDoneJson(jsonStr: string): void {
	let payload: DonePayload
	try {
		payload = JSON.parse(jsonStr)
	} catch {
		console.error('Error: Invalid JSON')
		process.exit(1)
	}

	if (!payload.task) {
		console.error('Error: JSON must contain "task" field')
		process.exit(1)
	}

	const tasks = loadTasks()
	const taskId = String(payload.task)
	const task = getTaskById(tasks, taskId)

	if (!task) {
		console.error(`Error: Task ${taskId} not found`)
		process.exit(1)
	}

	task.done = payload.status === 'done'
	task.blocked = payload.status === 'blocked'
	task.commitSha = payload.sha || null
	task.notes = payload.notes || payload.summary || ''

	saveTasks(tasks)
	console.log(
		`Marked task ${taskId} as ${payload.status} (commit: ${task.commitSha || 'none'})`,
	)
}

function cmdBlocked(id: string, notes: string): void {
	const tasks = loadTasks()
	const task = getTaskById(tasks, id)

	if (!task) {
		console.error(`Error: Task ${id} not found`)
		process.exit(1)
	}

	task.blocked = true
	task.done = false
	task.notes = notes

	saveTasks(tasks)
	console.log(`Marked task ${id} as blocked`)
}

interface CIResult {
	app: string
	check: string
	passed: boolean
	output: string
}

interface CIReturn {
	passed: boolean
	results: CIResult[]
}

async function cmdCi(): Promise<void> {
	const repoRoot = getRepoRoot()
	const appsDir = path.join(repoRoot, 'apps')

	if (!fs.existsSync(appsDir)) {
		console.error('Error: apps directory not found')
		process.exit(1)
	}

	const appDirs = fs.readdirSync(appsDir).filter((name) => {
		const pkgPath = path.join(appsDir, name, 'package.json')
		return fs.existsSync(pkgPath)
	})

	const checks = ['typecheck', 'lint', 'test:unit', 'e2e']
	const allResults: CIResult[] = []

	for (const app of appDirs) {
		for (const check of checks) {
			const result = await $({
				cwd: repoRoot,
				nothrow: true,
				stdio: 'pipe',
			})`pnpm --filter ${app} ${check}`

			allResults.push({
				app,
				check,
				passed: result.exitCode === 0,
				output: result.stderr || result.stdout,
			})
		}
	}

	const passed = allResults.every((r) => r.passed)
	const output: CIReturn = { passed, results: allResults }

	console.log(JSON.stringify(output, null, 2))

	if (!passed) {
		process.exit(1)
	}
}
function cmdWipe(): void {
	const tasks = loadTasks()
	const count = wipeAllProgress(tasks)
	saveTasks(tasks)
	console.log(`Wiped progress for ${count} tasks`)
}

async function readFromStdin(): Promise<string> {
	return new Promise((resolve) => {
		let data = ''
		process.stdin.on('data', (chunk) => {
			data += chunk
		})
		process.stdin.on('end', () => {
			resolve(data.trim())
		})
		process.stdin.on('error', () => {
			resolve('')
		})
		setTimeout(() => resolve(''), 100)
	})
}

function cmdProgress(args: string[]): void {
	if (args.length > 0) {
		console.error('Error: Usage: aamini pm progress')
		process.exit(1)
	}

	const tasks = loadTasks()
	const progress = getProgress(tasks)

	console.log(
		`${progress.completed}/${progress.total} completed (${progress.remaining} left)`,
	)
}

async function main(): Promise<void> {
	const cli = cac('aamini pm')
	cli.help()
	cli.version('0.0.1')

	cli.command('next', 'Show next available tasks').action(() => {
		cmdNext()
	})

	cli.command('progress', 'Show task progress').action(() => {
		cmdProgress([])
	})

	cli.command('wipe', 'Wipe all progress fields').action(() => {
		cmdWipe()
	})

	cli.command('show <id>', 'Show details for a task').action((id: string) => {
		cmdShow(id)
	})

	cli
		.command('update <id> <field> [...value]', 'Update task field')
		.action((id: string, field: string, value: string[] = []) => {
			if (value.length === 0) {
				console.error('Error: Usage: aamini pm update <id> <field> <value>')
				process.exit(1)
			}
			cmdUpdate(id, field, value.join(' '))
		})

	cli
		.command('done [taskOrJson] [commitSha] [...notes]', 'Mark task done')
		.action(
			async (
				taskOrJson: string | undefined,
				commitSha: string | undefined,
				notes: string[] = [],
			) => {
				if (!taskOrJson) {
					const jsonStr = await readFromStdin()
					if (jsonStr) {
						cmdDoneJson(jsonStr)
						return
					}
					console.error(
						'Error: Usage: aamini pm done <task-id> <commit-sha> [notes]',
					)
					console.error(
						'       or: aamini pm done \'{"task": 1, "status": "done", "sha": "abc", "notes": "..."}\'',
					)
					console.error('       or: echo \'{"task": 1, ...}\' | aamini pm done')
					process.exit(1)
				}

				if (taskOrJson.startsWith('{')) {
					cmdDoneJson(taskOrJson)
					return
				}

				if (!commitSha) {
					console.error(
						'Error: Usage: aamini pm done <task-id> <commit-sha> [notes]',
					)
					process.exit(1)
				}

				cmdDone(taskOrJson, commitSha, notes.join(' '))
			},
		)

	cli
		.command('blocked <id> [...notes]', 'Mark task blocked')
		.action((id: string, notes: string[] = []) => {
			cmdBlocked(id, notes.join(' '))
		})

	cli.command('ci', 'Run CI checks across all apps').action(async () => {
		await cmdCi()
	})

	cli.on('command:*', () => {
		console.error(`Error: Unknown command '${cli.args[0] ?? ''}'`)
		cli.outputHelp()
		process.exit(1)
	})

	cli.parse()
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}

export {
	areDependenciesMet,
	getNextTasks,
	getProgress,
	getTaskById,
	loadTasks,
	saveTasks,
	wipeAllProgress,
}
export type { CIResult, CIReturn, Task, TasksFile }
