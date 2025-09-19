import type * as React from 'react'
import { cn } from '@aamini/ui/lib/utils'

interface FruitAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
	emoji: string
	size?: 'sm' | 'default' | 'lg' | 'xl'
	variant?: 'default' | 'nature' | 'premium'
}

const sizeClasses = {
	sm: 'size-10 text-lg',
	default: 'size-14 text-2xl',
	lg: 'size-16 text-3xl',
	xl: 'size-20 text-4xl',
}

const variantClasses = {
	default: 'bg-gradient-to-br from-neutral-100 to-neutral-200',
	nature: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
	premium: 'bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-lg',
}

function FruitAvatar({
	className,
	emoji,
	size = 'default',
	variant = 'default',
	...props
}: FruitAvatarProps) {
	return (
		<div
			data-slot="fruit-avatar"
			className={cn(
				'relative flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
				sizeClasses[size],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			<span className="transition-transform duration-300 group-hover:scale-110">
				{emoji}
			</span>
		</div>
	)
}

export { FruitAvatar }
