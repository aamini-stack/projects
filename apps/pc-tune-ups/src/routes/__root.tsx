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
				content: 'width=device-width',
			},
			{
				title: 'PC Tune-Ups',
			},
			{
				name: 'description',
				content:
					'PC Tune-Ups delivers fast, professional phone, tablet, and computer repairs in Metairie with certified technicians and concierge-level service.',
			},
			{
				name: 'keywords',
				content:
					'pc repair, iphone repair, tablet repair, laptop repair, metairie, new orleans, kenner, LA',
			},
		],
		links: [
			{ rel: 'icon', type: 'image/png', href: '/icon.png' },
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
			<body className="m-0 h-full min-h-screen w-full min-w-[20rem] bg-stone-50 font-sans text-stone-900 antialiased">
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
