import * as React from 'react'
import { cn } from '@aamini/ui-neobrutalist/lib/utils'

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
	default:
		'bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
	nature:
		'bg-green-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
	premium:
		'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
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
				'relative flex shrink-0 items-center justify-center transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
				sizeClasses[size],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			<span className="select-none font-bold">{emoji}</span>
		</div>
	)
}

export { FruitAvatar }
