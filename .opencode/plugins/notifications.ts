export const NotificationPlugin = async ({
	project: _project,
	client: _client,
	$,
	directory: _directory,
	worktree: _worktree,
}) => {
	return {
		event: async ({ event }) => {
			// Send notification on session completion
			if (event.type === 'permission.asked') {
				await $`osascript -e 'display notification "Permission required!" with title "opencode"'`
			}
		},
	}
}
