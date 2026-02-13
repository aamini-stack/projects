import { cn } from '@aamini/ui-valentine/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-[--font-weight-base] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-[3px] cursor-pointer",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-[--shadow-warm-sm] hover:shadow-[--shadow-warm] hover:-translate-y-0.5',
				outline:
					'border border-border bg-card text-foreground shadow-[--shadow-warm-sm] hover:bg-secondary hover:shadow-[--shadow-warm] hover:-translate-y-0.5',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost:
					'text-foreground hover:bg-secondary hover:text-secondary-foreground',
				destructive:
					'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-5 py-2',
				sm: 'h-8 rounded-md gap-1.5 px-3 text-xs',
				lg: 'h-11 rounded-lg px-8 text-base',
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
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : 'button'

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
