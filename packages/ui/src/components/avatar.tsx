import { cn } from '@aamini/ui/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import type * as React from 'react'

function Avatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(
				'relative flex size-8 shrink-0 overflow-hidden rounded-2xl',
				className,
			)}
			{...props}
		/>
	)
}

function AvatarImage({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn('aspect-square size-full', className)}
			{...props}
		/>
	)
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				'flex size-full items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-inner transition-all duration-300',
				className,
			)}
			{...props}
		/>
	)
}

export { Avatar, AvatarFallback, AvatarImage }
