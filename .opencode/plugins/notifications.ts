export const NotificationPlugin = async ({
	project: _project,
	client: _client,
	$: _$,
	directory: _directory,
	worktree: _worktree,
}) => {
	let activeSessionID: string | undefined

	const notify = (title: string, body: string) => {
		const clean = (value: string) =>
			value.replace(/\p{Cc}/gu, ' ').replace(/[;:]/g, ',')
		const safeTitle = clean(title)
		const safeBody = clean(body)

		process.stdout.write(`\u001b]99;i=1;e=1;d=0;p=title:${safeTitle}\u001b\\`)
		process.stdout.write(`\u001b]99;i=1;e=1;d=1;p=body:${safeBody}\u001b\\`)
		process.stdout.write(`\u001b]777;notify;${safeTitle};${safeBody}\u0007`)
	}

	const isFocusedSessionEvent = (event: {
		type: string
		properties?: { sessionID?: string }
	}) => {
		const sessionID = event.properties?.sessionID
		return Boolean(
			sessionID && activeSessionID && sessionID === activeSessionID,
		)
	}

	return {
		event: async ({ event }) => {
			if (event.type === 'tui.session.select') {
				activeSessionID = event.properties.sessionID
				return
			}

			if (event.type === 'session.idle') {
				if (isFocusedSessionEvent(event)) return
				notify('OpenCode', 'Agent complete')
			}

			if (event.type === 'permission.asked') {
				if (isFocusedSessionEvent(event)) return
				notify('OpenCode', 'Agent blocked: permission requested')
			}
		},
	}
}
