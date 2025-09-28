import { cn } from '@aamini/ui-neobrutalist/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

const buttonVariants = cva(
	cn(
		'box-shadow inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-base border-2 border-border bg-main font-base text-main-foreground text-sm hover-effect [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
	),
	{
		variants: {
			variant: {
				default: 'hover-effect',
				noShadow: 'shadow-none',
				neutral: 'bg-secondary-background text-foreground hover-effect',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-11 px-8',
				icon: 'size-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

function Button({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
	return (
		<button
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

// https://github.com/shadcn-ui/ui/issues/1979
function LinkButton({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<'a'> &
	VariantProps<typeof buttonVariants> & {
		href: string
		download?: boolean
	}) {
	return (
		<a
			title="Link Button"
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

function ScrollButton({
	className,
	variant,
	size,
	scrollToId,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		scrollToId: string
	}) {
	return (
		<button
			onClick={() => document.getElementById(scrollToId)?.scrollIntoView()}
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Button, LinkButton, ScrollButton }
