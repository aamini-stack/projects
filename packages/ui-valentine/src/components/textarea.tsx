import { cn } from '@aamini/ui-valentine/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'border-input placeholder:text-muted-foreground bg-card flex field-sizing-content min-h-20 w-full rounded-lg border px-3 py-2 text-base shadow-[--shadow-warm-sm] transition-all duration-300 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-primary/50 focus-visible:ring-ring focus-visible:shadow-[--shadow-warm] focus-visible:ring-[3px]',
				'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
				className,
			)}
			{...props}
		/>
	)
}

export { Textarea }
