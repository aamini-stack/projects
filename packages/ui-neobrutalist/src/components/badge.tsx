import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import type * as React from 'react'

import { cn } from '@aamini/ui-neobrutalist/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center justify-center border-2 border-black font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px]',
	{
		variants: {
			variant: {
				default: 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
				neutral:
					'bg-gray-200 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
				day: 'bg-blue-200 text-blue-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
				nature:
					'bg-green-200 text-green-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
			},
			size: {
				sm: 'px-2 py-1 text-xs',
				default: 'px-2.5 py-1.5 text-sm',
				lg: 'px-3 py-2 text-base',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

function Badge({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'span'> &
	VariantProps<typeof badgeVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : 'span'

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	)
}

export { Badge, badgeVariants }
