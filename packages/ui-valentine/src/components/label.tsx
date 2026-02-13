import { cn } from '@aamini/ui-valentine/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				'font-[family-name:--font-heading] font-[--font-weight-heading] text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				className,
			)}
			{...props}
		/>
	)
}

export { Label }
