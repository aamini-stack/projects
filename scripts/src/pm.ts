#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Task {
	id: string
	title: string
	description: string
	todo: string[]
	dependencies: string[]
	commitSha: string | null
	done: boolean
	notes: string
}

interface TasksFile {
	tasks: Task[]
}

function getRepoRoot(): string {
	const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
		cwd: process.cwd(),
		encoding: 'utf8',
	})

	if (result.status === 0) {
		const root = result.stdout.trim()
		if (root) {
			return root
		}
	}

	return process.cwd()
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

function cmdWipe(): void {
	const tasks = loadTasks()
	const count = wipeAllProgress(tasks)
	saveTasks(tasks)
	console.log(`Wiped progress for ${count} tasks`)
}

function printHelp(): void {
	console.log(`
  pm - Project Manager CLI for tasks.json

	Usage:
	  pm next              Show next available tasks (topological order)
	  pm show <id>         Show details for a task (e.g., pm show 1)
	  pm wipe              Wipe all progress (done, notes, commitSha)
	  pm update <id> <field> <value>   Update a task field
                         Fields: done, notes, commitSha, title, description

	Examples:
	  pm next
	  pm show 1
	  pm wipe
	  pm update 1 done true
	  pm update 1 notes "Implemented with optimization"
`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)

	if (
		args.length === 0 ||
		args[0] === 'help' ||
		args[0] === '--help' ||
		args[0] === '-h'
	) {
		printHelp()
		return
	}

	const cmd = args[0]

	switch (cmd) {
		case 'next':
			cmdNext()
			break
		case 'wipe':
			cmdWipe()
			break
		case 'show':
			if (!args[1]) {
				console.error('Error: Please provide a task id')
				process.exit(1)
			}
			cmdShow(args[1])
			break
		case 'update':
			if (!args[1] || !args[2] || args[3] === undefined) {
				console.error('Error: Usage: pm update <id> <field> <value>')
				process.exit(1)
			}
			cmdUpdate(args[1], args[2], args.slice(3).join(' '))
			break
		default:
			console.error(`Error: Unknown command '${cmd}'`)
			printHelp()
			process.exit(1)
	}
}

if (process.argv[1] === import.meta.url.replace('file://', '')) {
	void main()
}

export {
	areDependenciesMet,
	getNextTasks,
	getTaskById,
	loadTasks,
	saveTasks,
	wipeAllProgress,
}
export type { Task, TasksFile }
