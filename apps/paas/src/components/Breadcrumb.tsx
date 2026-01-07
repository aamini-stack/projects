import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface BreadcrumbProps {
	children: ReactNode
}

export function Breadcrumb({ children }: BreadcrumbProps) {
	return (
		<div className="flex items-center gap-2 text-sm font-bold">{children}</div>
	)
}

interface BreadcrumbSegmentProps {
	href?: string | undefined
	children: ReactNode
	dropdown?: ReactNode
	isLast?: boolean
}

export function BreadcrumbSegment({
	href,
	children,
	dropdown,
	isLast = false,
}: BreadcrumbSegmentProps) {
	const content = (
		<span className="flex items-center gap-1">
			{children}
			{dropdown && <ChevronDown className="size-3" />}
		</span>
	)

	if (dropdown) {
		return dropdown
	}

	if (href && !isLast) {
		return (
			<Link
				to={href}
				className="border-2 border-black bg-white px-3 py-1.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[1px_1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
			>
				{content}
			</Link>
		)
	}

	return (
		<span className="border-2 border-black bg-[#E0E7F1] px-3 py-1.5 text-black">
			{content}
		</span>
	)
}

export function BreadcrumbSeparator() {
	return <span className="font-bold text-black">›</span>
}
