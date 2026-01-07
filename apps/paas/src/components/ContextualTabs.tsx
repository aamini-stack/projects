import { Link } from '@tanstack/react-router'

interface Tab {
	label: string
	href: string
}

interface ContextualTabsProps {
	tabs: Tab[]
	activeTab: string
}

export function ContextualTabs({ tabs, activeTab }: ContextualTabsProps) {
	return (
		<div className="border-b-2 border-black bg-white">
			<div className="mx-auto flex max-w-7xl gap-6 px-4 text-sm font-bold">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.label

					return (
						<Link
							key={tab.label}
							to={tab.href}
							className={`-mb-[2px] border-b-2 px-1 py-4 transition-all ${
								isActive
									? 'border-black text-black'
									: 'border-transparent text-neutral-500 hover:border-black/20 hover:text-black'
							}`}
						>
							{tab.label}
						</Link>
					)
				})}
			</div>
		</div>
	)
}
