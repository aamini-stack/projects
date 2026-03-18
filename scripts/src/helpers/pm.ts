import * as fs from 'node:fs'
import * as path from 'node:path'
import { $ } from 'zx'
import { getRepoRoot, getRepoRootSync } from './repo.ts'

export interface Task {
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

export interface TasksFile {
	tasks: Task[]
}

export interface CIResult {
	app: string
	check: string
	passed: boolean
	output: string
}

export interface CIReturn {
	passed: boolean
	results: CIResult[]
}

const TASKS_PATH = path.resolve(getRepoRootSync(), 'tasks.json')

export function loadTasks(): TasksFile {
	if (!fs.existsSync(TASKS_PATH)) {
		console.error('Error: tasks.json not found in current directory')
		process.exit(1)
	}
	return JSON.parse(fs.readFileSync(TASKS_PATH, 'utf-8'))
}

export function saveTasks(tasks: TasksFile): void {
	fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, '\t') + '\n')
}

export function getTaskById(tasks: TasksFile, id: string): Task | undefined {
	return tasks.tasks.find((t) => t.id === id)
}

export function areDependenciesMet(tasks: TasksFile, task: Task): boolean {
	return task.dependencies.every((depId) => {
		const dep = getTaskById(tasks, depId)
		return dep?.done === true
	})
}

export function getNextTasks(tasks: TasksFile): Task[] {
	return tasks.tasks.filter(
		(task) => !task.done && areDependenciesMet(tasks, task),
	)
}

export function wipeAllProgress(tasks: TasksFile): number {
	for (const task of tasks.tasks) {
		task.done = false
		task.commitSha = null
		task.notes = ''
	}
	return tasks.tasks.length
}

export function getProgress(tasks: TasksFile): {
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

export function cmdNext(): void {
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

export function cmdShow(id: string): void {
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

export function cmdUpdate(id: string, field: string, value: string): void {
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

export function cmdDone(id: string, commitSha: string, notes: string): void {
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

export interface DonePayload {
	task: number | string
	status: 'done' | 'blocked' | 'failed'
	sha?: string
	summary?: string
	notes?: string
}

export function cmdDoneJson(jsonStr: string): void {
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

export function cmdBlocked(id: string, notes: string): void {
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

export async function cmdCi(): Promise<void> {
	const repoRoot = await getRepoRoot()
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

export function cmdWipe(): void {
	const tasks = loadTasks()
	const count = wipeAllProgress(tasks)
	saveTasks(tasks)
	console.log(`Wiped progress for ${count} tasks`)
}

export async function readFromStdin(): Promise<string> {
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

export function cmdProgress(): void {
	const tasks = loadTasks()
	const progress = getProgress(tasks)

	console.log(
		`${progress.completed}/${progress.total} completed (${progress.remaining} left)`,
	)
}
