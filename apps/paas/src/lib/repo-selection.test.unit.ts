import { describe, expect, test } from 'vitest'
import {
	getSelectedRepos,
	isRepoSelected,
	toggleRepoSelection,
} from './repo-selection'

describe('Repo Selection', () => {
	test('toggles repository selection', () => {
		const selectedIds = new Set<string>()
		const newSelected = toggleRepoSelection(selectedIds, 'repo-1')

		expect(newSelected.has('repo-1')).toBe(true)
		expect(newSelected.size).toBe(1)
	})

	test('removes repository from selection', () => {
		const selectedIds = new Set(['repo-1', 'repo-2'])
		const newSelected = toggleRepoSelection(selectedIds, 'repo-1')

		expect(newSelected.has('repo-1')).toBe(false)
		expect(newSelected.has('repo-2')).toBe(true)
		expect(newSelected.size).toBe(1)
	})

	test('checks if repository is selected', () => {
		const selectedIds = new Set(['repo-1', 'repo-2'])

		expect(isRepoSelected(selectedIds, 'repo-1')).toBe(true)
		expect(isRepoSelected(selectedIds, 'repo-2')).toBe(true)
		expect(isRepoSelected(selectedIds, 'repo-3')).toBe(false)
	})

	test('gets selected repositories from list', () => {
		const repos = [
			{ id: 'repo-1', name: 'Repo 1' },
			{ id: 'repo-2', name: 'Repo 2' },
			{ id: 'repo-3', name: 'Repo 3' },
		]
		const selectedIds = new Set(['repo-1', 'repo-3'])

		const selected = getSelectedRepos(repos, selectedIds)

		expect(selected).toHaveLength(2)
		expect(selected[0]?.id).toBe('repo-1')
		expect(selected[1]?.id).toBe('repo-3')
	})
})
