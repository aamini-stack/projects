import { Button } from '@aamini/ui/components/button'
import { cn } from '@aamini/ui/lib/utils'
import { Instagram, Menu, X, Youtube } from 'lucide-react'
import { useState } from 'react'

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	const navItems = [
		{ href: '#duckyevents', label: 'Events' },
		{ href: '#duckyfest2023-aftermovie', label: 'Aftermovie' },
		{ href: '#about-us', label: 'Our Mission' },
		{ href: '#business-inquiries', label: 'Business Inquiries' },
	]

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	}

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full border-b border-gray-700/30 backdrop-blur-xl supports-backdrop:bg-black/60',
				isMenuOpen ? 'bg-black/95' : 'bg-black/80',
			)}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-20 items-center justify-between">
					{/* Social links */}
					<div className="flex items-center gap-4">
						<a
							href="https://www.instagram.com/ducky.mot/"
							className="group flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/50 hover:text-blue-400"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Instagram className="h-4 w-4" />
						</a>
						<a
							href="https://www.youtube.com/@duckymot"
							className="group flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/50 hover:text-red-400"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Youtube className="h-4 w-4" />
						</a>
					</div>

					{/* Navigation */}
					<nav className="hidden items-center space-x-8 md:flex">
						{navItems.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="group relative rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-white"
							>
								{item.label}
								<span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4"></span>
							</a>
						))}
					</nav>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<Button
							variant="ghost"
							size="sm"
							className="border-gray-700/50 text-gray-300 hover:bg-gray-800/50 hover:text-white"
							aria-label="Open menu"
							onClick={toggleMenu}
						>
							{isMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<nav
				className={cn(
					`absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden`,
					{
						block: isMenuOpen,
						hidden: !isMenuOpen,
					},
				)}
			>
				<div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
					{navItems.map((item) => (
						<Button
							key={item.href}
							variant="ghost"
							className="block w-full justify-start rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white"
							onClick={() => {
								toggleMenu()
								window.location.href = item.href
							}}
						>
							{item.label}
						</Button>
					))}
				</div>
			</nav>
		</header>
	)
}
