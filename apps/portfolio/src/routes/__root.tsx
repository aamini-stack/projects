/// <reference types="vite/client" />

import { Toaster } from '@/components/sonner'
import {
	ClientOnly,
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import appCss from '../styles.css?url'

function Analytics() {
	useEffect(() => {
		const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY?.trim()
		if (import.meta.env.MODE === 'development' || !posthogKey) return

		posthog.init(posthogKey, {
			api_host: '/api/ingest',
			ui_host: 'https://us.posthog.com',
			defaults: '2025-05-24',
			person_profiles: 'always',
		})
	}, [])

	return null
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
				<ClientOnly fallback={null}>
					<Analytics />
				</ClientOnly>
				<Toaster className="offset-y-(--header-size)" />
				<Scripts />
			</body>
		</html>
	)
}
