import { Button } from '@aamini/ui/components/button'
import { cn } from '@aamini/ui/lib/utils'
import { ExternalLink, Instagram, Menu, X, Youtube } from 'lucide-react'
import { useState } from 'react'

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	}

	return (
		<header className="supports-backdrop:bg-black/60 sticky top-0 z-50 w-full border-b border-gray-700/30 bg-black/80 backdrop-blur-xl">
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
							<span className="hidden sm:inline">Instagram</span>
							<ExternalLink className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
						</a>
						<a
							href="https://www.youtube.com/@duckymot"
							className="group flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/50 hover:text-red-400"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Youtube className="h-4 w-4" />
							<span className="hidden sm:inline">YouTube</span>
							<ExternalLink className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
						</a>
					</div>

					{/* Navigation */}
					<nav className="hidden items-center space-x-8 md:flex">
						<a
							href="#duckyfest2023-aftermovie"
							className="group relative rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-white"
						>
							Aftermovie
							<span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4"></span>
						</a>
						<a
							href="#duckyevents"
							className="group relative rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-white"
						>
							Ducky Events
							<span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4"></span>
						</a>
						<a
							href="#about-us"
							className="group relative rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-white"
						>
							Our Mission
							<span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4"></span>
						</a>
						<a
							href="#business-inquiries"
							className="group relative rounded-lg px-3 py-2 font-medium text-gray-300 transition-all duration-300 hover:bg-gray-800/30 hover:text-white"
						>
							Business Inquiries
							<span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4"></span>
						</a>
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
					`absolute left-0 top-full w-full bg-black/90 backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden`,
					{
						block: isMenuOpen,
						hidden: !isMenuOpen,
					},
				)}
			>
				<div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
					<MobileNavButton href="#duckyevents" onClick={toggleMenu}>
						Ducky Events
					</MobileNavButton>
					<MobileNavButton
						href="#duckyfest2023-aftermovie"
						onClick={toggleMenu}
					>
						Aftermovie
					</MobileNavButton>
					<MobileNavButton href="#about-us" onClick={toggleMenu}>
						Our Mission
					</MobileNavButton>
					<MobileNavButton href="#business-inquiries" onClick={toggleMenu}>
						Business Inquiries
					</MobileNavButton>
				</div>
			</nav>
		</header>
	)
}

interface MobileNavButtonProps {
	href: string
	onClick: () => void
	children: React.ReactNode
}

export function MobileNavButton({
	href,
	onClick,
	children,
}: MobileNavButtonProps) {
	return (
		<Button
			variant="ghost"
			className="block w-full justify-start rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white"
			onClick={() => {
				onClick()
				window.location.href = href
			}}
		>
			{children}
		</Button>
	)
}
