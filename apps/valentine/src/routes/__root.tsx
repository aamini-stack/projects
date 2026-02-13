/// <reference types="vite/client" />

import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
			{ title: 'Be My Valentine' },
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: RootComponent,
})

function RootComponent() {
	return (
		<html lang="en" className="m-0 h-full w-full">
			<head>
				<HeadContent />
			</head>
			<body className="m-0 min-h-full w-full bg-background font-sans text-foreground antialiased">
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
