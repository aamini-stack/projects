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
		<header className="sticky top-0 z-50 w-full border-b border-gray-700/30 bg-black/80 backdrop-blur-xl supports-backdrop:bg-black/60">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-20 items-center justify-between">
					{/* Social links */}
					<div className="flex items-center gap-4">
						<a
							href="https://www.instagram.com/ducky.mot/"
							className="group flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-all duration-300 font-medium px-3 py-2 rounded-lg hover:bg-gray-800/50"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Instagram className="w-4 h-4" />
							<span className="hidden sm:inline">Instagram</span>
							<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
						</a>
						<a
							href="https://www.youtube.com/@duckymot"
							className="group flex items-center gap-2 text-gray-300 hover:text-red-400 transition-all duration-300 font-medium px-3 py-2 rounded-lg hover:bg-gray-800/50"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Youtube className="w-4 h-4" />
							<span className="hidden sm:inline">YouTube</span>
							<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
						</a>
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						<a
							href="#duckyfest2023-aftermovie"
							className="text-gray-300 hover:text-white transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-gray-800/30"
						>
							Aftermovie
							<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4 rounded-full"></span>
						</a>
						<a
							href="#duckyevents"
							className="text-gray-300 hover:text-white transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-gray-800/30"
						>
							Ducky Events
							<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4 rounded-full"></span>
						</a>
						<a
							href="#about-us"
							className="text-gray-300 hover:text-white transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-gray-800/30"
						>
							Our Mission
							<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4 rounded-full"></span>
						</a>
						<a
							href="#business-inquiries"
							className="text-gray-300 hover:text-white transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-gray-800/30"
						>
							Business Inquiries
							<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-3/4 rounded-full"></span>
						</a>
					</nav>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<Button
							variant="ghost"
							size="sm"
							className="text-gray-300 hover:text-white hover:bg-gray-800/50 border-gray-700/50"
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
					`md:hidden bg-black/90 backdrop-blur-xl transition-all duration-300 ease-in-out`,
					{
						block: isMenuOpen,
						hidden: !isMenuOpen,
					},
				)}
			>
				<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
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
			className="block w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 px-3 py-2 rounded-md text-base font-medium"
			onClick={() => {
				onClick()
				window.location.href = href
			}}
		>
			{children}
		</Button>
	)
}
