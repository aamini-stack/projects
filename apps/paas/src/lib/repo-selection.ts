export function toggleRepoSelection(
	selectedIds: Set<string>,
	repoId: string,
): Set<string> {
	const newSelected = new Set(selectedIds)
	if (newSelected.has(repoId)) {
		newSelected.delete(repoId)
	} else {
		newSelected.add(repoId)
	}
	return newSelected
}

export function isRepoSelected(
	selectedIds: Set<string>,
	repoId: string,
): boolean {
	return selectedIds.has(repoId)
}

export function getSelectedRepos<T extends { id: string }>(
	repos: T[],
	selectedIds: Set<string>,
): T[] {
	return repos.filter((repo) => selectedIds.has(repo.id))
}
