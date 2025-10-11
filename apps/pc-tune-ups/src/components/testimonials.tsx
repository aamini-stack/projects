import { Avatar, AvatarImage } from '@aamini/ui/components/avatar'

export function Testimonials() {
	const testimonials = [
		{
			quote:
				"I highly recommend. Had two of my business pc's crash on me at two different times and these guy got my computers back up and running smoother then it has ever been before.",
			name: 'Rory',
			role: 'Business Owner',
			avatar: '/reviews/rory-150x150.jpg',
		},
		{
			quote: 'Great group of people just got my PC back and it works flawless',
			name: 'Damian',
			role: 'Customer',
			avatar: '/reviews/damian-150x150.jpg',
		},
		{
			quote:
				'Amazing service! Definitely going there again when I need parts !',
			name: 'Dylan',
			role: 'Customer',
			avatar: '/reviews/dylan-150x150.jpg',
		},
		{
			quote:
				'We had problems with our router  and they knew exactly what was wrong and fixed it.',
			name: "Eddie O'Brian",
			role: 'Co-founder, Break-thru Productions',
			avatar: '/reviews/break-150x83.jpg',
		},
	]

	return (
		<section className="space-y-8">
			<h2 className="text-center text-4xl font-bold tracking-tight text-stone-900">
				Happy Customers
			</h2>
			<div className="grid gap-6 [columns:300px]">
				{testimonials.map(({ name, quote, avatar, role }) => (
					<article
						key={name}
						className="min-w-sm flex h-fit max-w-sm flex-col space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
					>
						<p className="leading-relaxed text-stone-600">{quote}</p>
						<div className="flex items-center gap-3 border-t border-stone-200 pt-4">
							<Avatar>
								<AvatarImage src={avatar} alt={`${name} avatar`} />
							</Avatar>
							<div>
								<p className="text-sm font-semibold text-stone-900">{name}</p>
								<p className="text-xs text-stone-500">{role}</p>
							</div>
						</div>
					</article>
				))}
			</div>
		</section>
	)
}
