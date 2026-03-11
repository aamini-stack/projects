export function planGitopsTags(input: {
	sha: string
	prNumber?: number
}): string[] {
	if (input.prNumber == null) {
		return ['latest']
	}

	return [`pr-${input.prNumber}`, input.sha]
}
