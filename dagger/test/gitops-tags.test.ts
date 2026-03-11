import { describe, expect, it } from 'vitest'
import { planGitopsTags } from '../src/gitops/tags.ts'

describe('planGitopsTags', () => {
	it('returns latest for mainline publishing', () => {
		expect(
			planGitopsTags({
				sha: 'abc123',
				prNumber: undefined,
			}),
		).toEqual(['latest'])
	})

	it('returns pr and sha tags for pull requests', () => {
		expect(
			planGitopsTags({
				sha: 'abc123',
				prNumber: 42,
			}),
		).toEqual(['pr-42', 'abc123'])
	})
})
