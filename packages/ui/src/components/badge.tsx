import type * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@aamini/ui/lib/utils'

const badgeVariants = cva(
	'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden',
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
				destructive:
					'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
				nature:
					'border-emerald-200 bg-emerald-50 text-emerald-700 [a&]:hover:bg-emerald-100',
				sage: 'border-sage-200 bg-sage-50 text-sage-700 [a&]:hover:bg-sage-100',
				day: 'border-transparent bg-white/20 text-white font-semibold px-4 py-2 [a&]:hover:bg-white/30',
			},
			size: {
				default: 'px-3 py-1 text-xs',
				sm: 'px-2 py-0.5 text-xs',
				lg: 'px-4 py-2 text-sm font-semibold',
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
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
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
