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
				title: 'Dota 2 Hero Stats',
			},
			{
				name: 'description',
				content: 'Website to visualize Dota 2 hero statistics.',
			},
			{
				name: 'keywords',
				content: 'Dota 2, Hero Stats, DOTABUFF, OpenDota, Hero Data',
			},
			{
				property: 'og:title',
				content: 'Dota 2 Hero Stats - Comprehensive Hero Data',
			},
			{
				property: 'og:description',
				content: 'Visualize and compare Dota 2 hero stats in one place.',
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
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' },
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootComponent,
})

function RootComponent() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
