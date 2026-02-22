import { describe, expect, it } from 'vitest'
import {
	areDependenciesMet,
	getNextTasks,
	getTaskById,
	type TasksFile,
	wipeAllProgress,
} from './pm.js'

function createMockTasks(): TasksFile {
	return {
		tasks: [
			{
				id: '1',
				title: 'Task 1',
				description: 'First task',
				todo: ['Item 1'],
				dependencies: [],
				commitSha: null,
				done: false,
				notes: '',
			},
			{
				id: '2',
				title: 'Task 2',
				description: 'Second task',
				todo: ['Item 2'],
				dependencies: ['1'],
				commitSha: null,
				done: false,
				notes: '',
			},
			{
				id: '3',
				title: 'Task 3',
				description: 'Third task',
				todo: ['Item 3'],
				dependencies: [],
				commitSha: 'abc123',
				done: true,
				notes: 'Completed',
			},
		],
	}
}

describe('getTaskById', () => {
	it('finds task by id', () => {
		const tasks = createMockTasks()
		const task = getTaskById(tasks, '2')
		expect(task?.title).toBe('Task 2')
	})

	it('returns undefined for unknown id', () => {
		const tasks = createMockTasks()
		const task = getTaskById(tasks, '9')
		expect(task).toBeUndefined()
	})
})

describe('areDependenciesMet', () => {
	it('returns true for task with no dependencies', () => {
		const tasks = createMockTasks()
		const task = getTaskById(tasks, '1')!
		expect(areDependenciesMet(tasks, task)).toBe(true)
	})

	it('returns false when dependency is not done', () => {
		const tasks = createMockTasks()
		const task = getTaskById(tasks, '2')!
		expect(areDependenciesMet(tasks, task)).toBe(false)
	})

	it('returns true when all dependencies are done', () => {
		const tasks = createMockTasks()
		tasks.tasks[0]!.done = true
		const task = getTaskById(tasks, '2')!
		expect(areDependenciesMet(tasks, task)).toBe(true)
	})
})

describe('getNextTasks', () => {
	it('returns tasks with met dependencies (excludes done)', () => {
		const tasks = createMockTasks()
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(1)
		expect(next[0]!.id).toBe('1')
	})

	it('returns empty array when all tasks done', () => {
		const tasks = createMockTasks()
		for (const task of tasks.tasks) {
			task.done = true
		}
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(0)
	})

	it('returns dependent task when prerequisite done', () => {
		const tasks = createMockTasks()
		tasks.tasks[0]!.done = true
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(1)
		expect(next[0]!.id).toBe('2')
	})
})

describe('wipeAllProgress', () => {
	it('resets done, notes, and commitSha for all tasks', () => {
		const tasks = createMockTasks()
		tasks.tasks[0]!.done = true
		tasks.tasks[0]!.commitSha = 'xyz789'
		tasks.tasks[0]!.notes = 'in progress'

		const count = wipeAllProgress(tasks)

		expect(count).toBe(3)
		for (const task of tasks.tasks) {
			expect(task.done).toBe(false)
			expect(task.commitSha).toBeNull()
			expect(task.notes).toBe('')
		}
	})
})
