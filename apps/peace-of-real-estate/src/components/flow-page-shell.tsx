import { Link } from '@tanstack/react-router'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type FlowPageShellProps = {
	backTo: string
	backLabel: string
	title: string
	subtitle: string
	icon: LucideIcon
	iconClassName: string
	children: ReactNode
}

export function FlowPageShell({
	backTo,
	backLabel,
	title,
	subtitle,
	icon: Icon,
	iconClassName,
	children,
}: FlowPageShellProps) {
	return (
		<div className="mx-auto w-full max-w-[42rem] px-6 py-12">
			<div className="mb-12">
				<Link
					to={backTo}
					className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					{backLabel}
				</Link>
				<div className="hairline mb-6" />
				<div className="flex items-center gap-4">
					<div
						className={`${iconClassName} border-border flex h-10 w-10 items-center justify-center border`}
					>
						<Icon className="h-5 w-5" />
					</div>
					<div>
						<div className="data-label mb-1">{subtitle}</div>
						<h1 className="font-serif text-2xl font-normal tracking-tight">
							{title}
						</h1>
					</div>
				</div>
			</div>

			<div className="border-border bg-card card-institutional p-8 md:p-10">
				{children}
			</div>
		</div>
	)
}
