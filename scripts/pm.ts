#!/usr/bin/env node
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Story {
	id: string
	title: string
	description: string
	todo: string[]
	dependencies: string[]
	commitSha: string | null
	done: boolean
	notes: string
}

interface Epic {
	id: number
	title: string
	stories: Story[]
}

interface TasksFile {
	epics: Epic[]
}

const TASKS_PATH = path.resolve(process.cwd(), 'tasks.json')

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

function getAllStories(tasks: TasksFile): Story[] {
	return tasks.epics.flatMap((epic) => epic.stories)
}

function getStoryById(tasks: TasksFile, id: string): Story | undefined {
	return getAllStories(tasks).find((s) => s.id === id)
}

function areDependenciesMet(tasks: TasksFile, story: Story): boolean {
	return story.dependencies.every((depId) => {
		const dep = getStoryById(tasks, depId)
		return dep?.done === true
	})
}

function getNextTasks(tasks: TasksFile): Story[] {
	const available: Story[] = []

	for (const epic of tasks.epics) {
		for (const story of epic.stories) {
			if (!story.done && areDependenciesMet(tasks, story)) {
				available.push(story)
			}
		}
	}

	return available
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
	for (const story of next) {
		console.log(`  ${story.id}: ${story.title}`)
	}
}

function cmdShow(id: string): void {
	const tasks = loadTasks()
	const story = getStoryById(tasks, id)

	if (!story) {
		console.error(`Error: Story ${id} not found`)
		process.exit(1)
	}

	console.log(`\n  ${story.id}: ${story.title}`)
	console.log('  ─'.repeat(30))
	console.log(`  Description: ${story.description}`)
	console.log(`  Done: ${story.done}`)
	console.log(
		`  Dependencies: ${story.dependencies.length > 0 ? story.dependencies.join(', ') : 'none'}`,
	)
	console.log(`  Commit: ${story.commitSha || 'none'}`)
	console.log(`  Todo:`)
	for (const item of story.todo) {
		console.log(`    - ${item}`)
	}
	if (story.notes) {
		console.log(`  Notes: ${story.notes}`)
	}
	console.log()
}

function cmdUpdate(id: string, field: string, value: string): void {
	const tasks = loadTasks()

	let found = false
	for (const epic of tasks.epics) {
		for (const story of epic.stories) {
			if (story.id === id) {
				found = true

				if (field === 'done') {
					story.done = value === 'true'
				} else if (field === 'notes') {
					story.notes = value
				} else if (field === 'commitSha') {
					story.commitSha = value
				} else if (field === 'title') {
					story.title = value
				} else if (field === 'description') {
					story.description = value
				} else if (field in story) {
					console.error(`Error: Cannot update field '${field}' directly`)
					process.exit(1)
				} else {
					console.error(`Error: Unknown field '${field}'`)
					process.exit(1)
				}
			}
		}
	}

	if (!found) {
		console.error(`Error: Story ${id} not found`)
		process.exit(1)
	}

	saveTasks(tasks)
	console.log(`Updated ${id}.${field} = ${value}`)
}

function printHelp(): void {
	console.log(`
  pm - Project Manager CLI for tasks.json

  Usage:
    pm next              Show next available tasks (topological order)
    pm show <id>         Show details for a story (e.g., pm show 1.1)
    pm update <id> <field> <value>   Update a story field
                         Fields: done, notes, commitSha, title, description

  Examples:
    pm next
    pm show 1.1
    pm update 1.1 done true
    pm update 1.1 notes "Implemented with optimization"
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
		case 'show':
			if (!args[1]) {
				console.error('Error: Please provide a story id')
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
	main()
}

export {
	areDependenciesMet,
	getAllStories,
	getNextTasks,
	getStoryById,
	loadTasks,
	saveTasks,
}
export type { Epic, Story, TasksFile }
