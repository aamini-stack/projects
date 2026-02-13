import { cn } from '@aamini/ui-valentine/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'file:text-foreground placeholder:text-muted-foreground selection:bg-primary/20 selection:text-foreground border-input h-10 w-full min-w-0 rounded-lg border bg-card px-3 py-2 text-base shadow-[--shadow-warm-sm] transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-primary/50 focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:shadow-[--shadow-warm]',
				'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
