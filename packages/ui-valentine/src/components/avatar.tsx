import { cn } from '@aamini/ui-valentine/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

function Avatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(
				'border-border relative flex size-10 shrink-0 overflow-hidden rounded-full border shadow-[--shadow-warm-sm]',
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
				'bg-secondary text-secondary-foreground flex size-full items-center justify-center rounded-full font-[--font-weight-heading] font-[family-name:--font-heading]',
				className,
			)}
			{...props}
		/>
	)
}

export { Avatar, AvatarFallback, AvatarImage }
