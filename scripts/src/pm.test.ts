import { describe, expect, it } from 'vitest'
import {
	areDependenciesMet,
	getAllStories,
	getNextTasks,
	getStoryById,
	type TasksFile,
	wipeAllProgress,
} from './pm.js'

function createMockTasks(): TasksFile {
	return {
		epics: [
			{
				id: 1,
				title: 'Epic 1',
				stories: [
					{
						id: '1.1',
						title: 'Story 1.1',
						description: 'First story',
						todo: ['Task 1'],
						dependencies: [],
						commitSha: null,
						done: false,
						notes: '',
					},
					{
						id: '1.2',
						title: 'Story 1.2',
						description: 'Second story',
						todo: ['Task 2'],
						dependencies: ['1.1'],
						commitSha: null,
						done: false,
						notes: '',
					},
				],
			},
			{
				id: 2,
				title: 'Epic 2',
				stories: [
					{
						id: '2.1',
						title: 'Story 2.1',
						description: 'Third story',
						todo: ['Task 3'],
						dependencies: [],
						commitSha: 'abc123',
						done: true,
						notes: 'Completed',
					},
				],
			},
		],
	}
}

describe('getAllStories', () => {
	it('returns all stories from all epics', () => {
		const tasks = createMockTasks()
		const stories = getAllStories(tasks)
		expect(stories).toHaveLength(3)
		expect(stories.map((s) => s.id)).toEqual(['1.1', '1.2', '2.1'])
	})
})

describe('getStoryById', () => {
	it('finds story by id', () => {
		const tasks = createMockTasks()
		const story = getStoryById(tasks, '1.2')
		expect(story?.title).toBe('Story 1.2')
	})

	it('returns undefined for unknown id', () => {
		const tasks = createMockTasks()
		const story = getStoryById(tasks, '9.9')
		expect(story).toBeUndefined()
	})
})

describe('areDependenciesMet', () => {
	it('returns true for story with no dependencies', () => {
		const tasks = createMockTasks()
		const story = getStoryById(tasks, '1.1')!
		expect(areDependenciesMet(tasks, story)).toBe(true)
	})

	it('returns false when dependency is not done', () => {
		const tasks = createMockTasks()
		const story = getStoryById(tasks, '1.2')!
		expect(areDependenciesMet(tasks, story)).toBe(false)
	})

	it('returns true when all dependencies are done', () => {
		const tasks = createMockTasks()
		tasks.epics[0]!.stories[0]!.done = true
		const story = getStoryById(tasks, '1.2')!
		expect(areDependenciesMet(tasks, story)).toBe(true)
	})
})

describe('getNextTasks', () => {
	it('returns tasks with met dependencies in order', () => {
		const tasks = createMockTasks()
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(1)
		expect(next[0]!.id).toBe('1.1')
	})

	it('returns empty array when all tasks done', () => {
		const tasks = createMockTasks()
		tasks.epics[0]!.stories[0]!.done = true
		tasks.epics[0]!.stories[1]!.done = true
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(0)
	})

	it('returns multiple tasks when dependencies allow', () => {
		const tasks = createMockTasks()
		tasks.epics[0]!.stories[0]!.done = true
		const next = getNextTasks(tasks)
		expect(next).toHaveLength(1)
		expect(next[0]!.id).toBe('1.2')
	})
})

describe('wipeAllProgress', () => {
	it('resets done, notes, and commitSha for all stories', () => {
		const tasks = createMockTasks()
		tasks.epics[0]!.stories[0]!.done = true
		tasks.epics[0]!.stories[0]!.commitSha = 'xyz789'
		tasks.epics[0]!.stories[0]!.notes = 'in progress'

		const count = wipeAllProgress(tasks)

		expect(count).toBe(3)
		for (const epic of tasks.epics) {
			for (const story of epic.stories) {
				expect(story.done).toBe(false)
				expect(story.commitSha).toBeNull()
				expect(story.notes).toBe('')
			}
		}
	})
})
