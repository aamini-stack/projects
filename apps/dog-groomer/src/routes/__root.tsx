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
			{ name: 'viewport', content: 'width=device-width' },
			{ title: 'Pawlished Pups | Premium Dog Grooming' },
			{
				name: 'description',
				content: 'Professional dog grooming with barbershop soul. Where every pup gets the gentleman\'s treatment.',
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
			<body className="antialiased theme-bg-primary theme-text-primary">
				<Outlet />
				<Scripts />
			</body>
		</html>
	)
}
