/// <reference types="vite/client" />

import { Toaster } from '#/components/sonner'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import posthog from 'posthog-js'
import appCss from '../styles.css?url'

if (import.meta.env.MODE !== 'development') {
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		api_host: '/api/analytics',
		ui_host: 'https://us.posthog.com',
		defaults: '2025-05-24',
		person_profiles: 'always',
	})
} else {
	console.log('Posthog not initialized in dev mode.')
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width',
			},
			{
				title: 'Aria Amini - Portfolio',
			},
			{
				name: 'description',
				content: 'Portfolio of Aria Amini, a software engineer.',
			},
		],
		links: [
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' },
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootComponent,
})

function RootComponent() {
	return (
		<html lang="en" className="scroll-smooth">
			<head>
				<HeadContent />
			</head>
			<body className="antialiased">
				<Outlet />
				<Toaster className="offset-y-(--header-size)" />
				<Scripts />
			</body>
		</html>
	)
}
