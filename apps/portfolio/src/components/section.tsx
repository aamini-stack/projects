import { cn } from '@aamini/ui/lib/utils'

/** https://getpublii.com/blog/one-line-css-solution-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header.html */
export const Section = ({
	className,
	...props
}: React.ComponentProps<'section'>) => {
	return (
		<section className={cn('border-t-2 px-6 py-16', className)} {...props}>
			<h2 className="pb-12 text-center text-5xl font-bold">{props.title}</h2>
			<div className="flex items-center justify-center">{props.children}</div>
		</section>
	)
}
