import { Badge } from '@aamini/ui/components/badge'
import { Button } from '@aamini/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@aamini/ui/components/card'

export function FeatureCard() {
	return (
		<aside className="w-full lg:w-80 xl:w-96">
			<Card className="bg-card/80 group border-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
				<CardHeader>
					<div className="mb-2 flex items-center gap-3">
						<div className="rounded-lg bg-gradient-to-br from-orange-400 to-red-500 p-2 text-white">
							<svg
								width="24"
								height="24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="transition-transform group-hover:rotate-12"
							>
								<title>RSS Blog Logo</title>
								<path
									d="M18.5 9c1 1.06 1.5 2.39 1.5 4 0 3.46-3.7 4.27-5.5 9C13.83 21.42 13.5 20.59 13.5 19.5c0-3.48 5-5.29 5-10.5Zm-4-4c1.2 1.24 1.8 2.57 1.8 4 0 4.95-6.05 5.68-4.8 13C10.58 20.84 9.75 19.17 9.75 17c0-3.33 5.5-6 5.5-12Zm-4.5-4C11.33 2.67 12 4.17 12 5.5c0 6.25-8.5 8.22-4 16.5-2.61-.58-4.5-3-4.5-6 0-6.5 6.5-7.5 6.5-15Z"
									fill="currentColor"
								></path>
							</svg>
						</div>
						<Badge variant="secondary" className="text-xs">
							New
						</Badge>
					</div>
					<CardTitle className="group-hover:text-primary text-xl font-semibold transition-colors">
						What's New in Astro 5.0?
					</CardTitle>
					<CardDescription className="text-sm leading-relaxed">
						From content layers to server islands, discover the latest features
						and improvements in Astro 5.0
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						asChild
						variant="ghost"
						className="text-muted-foreground hover:text-foreground h-auto w-full justify-start p-0 font-normal"
					>
						<a
							href="https://astro.build/blog/astro-5/"
							className="flex items-center gap-2"
						>
							Learn more
							<svg
								className="h-4 w-4 transition-transform group-hover:translate-x-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Astro Logo</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
						</a>
					</Button>
				</CardContent>
			</Card>
		</aside>
	)
}
