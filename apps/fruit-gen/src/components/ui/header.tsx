import { cn } from '@aamini/ui/lib/utils'
import { Apple, Calendar, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
	activeTabId?: string
	className?: string
}

const tabs = [
	{ id: '/', label: 'Plan', icon: Calendar },
	{ id: '/all', label: 'All Fruits', icon: Apple },
]

export function Header({ activeTabId = '/', className }: HeaderProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	return (
		<header
			className={cn('border-border relative border-b-4 bg-white', className)}
		>
			<div className="mx-auto max-w-7xl px-6 py-6">
				{/* Main Header Row */}
				<div className="flex items-center justify-between">
					{/* Logo Section */}
					<div className="flex items-center gap-4">
						<div className="group relative">
							<div className="box-shadow rounded-base bg-main border-border border-4 p-4">
								<Apple size={32} className="text-main-foreground" />
							</div>
						</div>
						<div>
							<h1 className="font-heading text-foreground text-3xl tracking-tight">
								fruit-gen.com
							</h1>
							<p className="text-foreground font-base text-sm">
								Eat more fruit
							</p>
						</div>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex">
						<div className="box-shadow rounded-base bg-main border-border border-4 p-1">
							<div className="flex gap-1">
								{tabs.map((tab) => {
									const Icon = tab.icon
									return (
										<a
											key={tab.id}
											href={tab.id}
											className={cn(
												'rounded-base flex items-center gap-2 border-2 px-6 py-3 font-bold',
												{
													'bg-secondary-background text-foreground border-border':
														activeTabId === tab.id,
													'text-main-foreground border-transparent bg-transparent':
														activeTabId !== tab.id,
												},
											)}
										>
											<Icon size={18} />
											{tab.label}
										</a>
									)
								})}
							</div>
						</div>
					</nav>

					{/* Mobile Menu Button */}
					<button
						type="button"
						onClick={() => {
							setMobileMenuOpen(!mobileMenuOpen)
						}}
						className="box-shadow rounded-base bg-main border-border border-4 p-3 md:hidden"
					>
						{mobileMenuOpen ? (
							<X size={24} className="text-main-foreground" />
						) : (
							<Menu size={24} className="text-main-foreground" />
						)}
					</button>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className="mt-6 md:hidden">
						<div className="box-shadow rounded-base bg-main border-border border-4 p-2">
							<div className="flex flex-col gap-1">
								{tabs.map((tab) => {
									const Icon = tab.icon
									return (
										<a
											key={tab.id}
											href={tab.id}
											onClick={() => {
												setMobileMenuOpen(false)
											}}
											className={cn(
												'rounded-base flex items-center gap-3 border-2 px-4 py-3 font-bold',
												{
													'bg-secondary-background text-foreground border-border':
														activeTabId === tab.id,
													'text-main-foreground border-transparent bg-transparent':
														activeTabId !== tab.id,
												},
											)}
										>
											<Icon size={18} />
											{tab.label}
										</a>
									)
								})}
							</div>
						</div>
					</div>
				)}
			</div>
		</header>
	)
}
