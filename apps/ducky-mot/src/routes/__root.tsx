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
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1.0',
			},
			{
				title: 'DuckyMot - Events',
			},
			{
				name: 'description',
				content:
					'Join us at Ducky Fest for an unforgettable music festival experience featuring world-class artists, amazing performances, and incredible vibes.',
			},
			{
				name: 'keywords',
				content:
					'ducky fest, music festival, live music, concerts, artists, entertainment',
			},
			{
				property: 'og:title',
				content: 'Ducky Fest - The Ultimate Music Festival Experience',
			},
			{
				property: 'og:description',
				content:
					'Join us at Ducky Fest for an unforgettable music festival experience featuring world-class artists, amazing performances, and incredible vibes.',
			},
			{
				property: 'og:type',
				content: 'website',
			},
			{
				name: 'twitter:card',
				content: 'summary_large_image',
			},
		],
		links: [
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootComponent,
})

function RootComponent() {
	return (
		<html lang="en" className="dark m-0 h-full w-full">
			<head>
				<HeadContent />
			</head>
			<body className="m-0 h-full w-full bg-black font-mono text-white antialiased">
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
