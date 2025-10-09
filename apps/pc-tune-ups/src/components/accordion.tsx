import {
	Accordion as AccordionBase,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@aamini/ui/components/accordion'

export function Accordion() {
	return (
		<AccordionBase type="single" collapsible className="mt-8 space-y-4">
			{[
				{
					title: 'How fast can you repair my phone?',
					content:
						'Most screen and battery repairs are completed in under two hours. Rush service is available—call ahead and we’ll prioritize your device.',
				},
				{
					title: 'Do I need an appointment?',
					content:
						'Walk-ins are always welcome. To guarantee immediate service, book ahead and we’ll have a technician ready when you arrive.',
				},
				{
					title: 'Is my data safe?',
					content:
						'We follow strict data-handling protocols. If data access is required, we’ll request explicit permission and keep you updated throughout.',
				},
				{
					title: 'What if the repair doesn’t work?',
					content:
						'Every repair includes a 90-day warranty. If issues persist, bring it back—we’ll make it right or credit the repair cost toward another solution.',
				},
			].map(({ title, content }) => (
				<AccordionItem
					key={title}
					value={title}
					className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4"
				>
					<AccordionTrigger className="text-left text-lg font-medium text-white hover:text-emerald-200">
						{title}
					</AccordionTrigger>
					<AccordionContent className="pb-4 text-sm text-white/70">
						{content}
					</AccordionContent>
				</AccordionItem>
			))}
		</AccordionBase>
	)
}
