import { Avatar, AvatarImage } from '@aamini/ui/components/avatar'
import { cn } from '@aamini/ui/lib/utils'

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
			<div className="space-y-3 text-center">
				<h2 className="text-4xl font-bold tracking-tight text-stone-900">
					Happy Customers
				</h2>
			</div>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{testimonials.map((testimonial, index) => (
					<div
						key={testimonial.name}
						className={cn({ 'sm:col-span-2 lg:col-span-1': index === 3 })}
					>
						<blockquote className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
							<div className="absolute right-4 top-4 text-4xl text-lime-200">
								"
							</div>
							<div className="space-y-4">
								<p className="relative z-10 text-base leading-relaxed text-stone-600 sm:text-lg">
									{testimonial.quote}
								</p>
								<div className="flex items-center gap-3 border-t border-stone-200 pt-2">
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={testimonial.avatar}
											alt={`${testimonial.name} avatar`}
										/>
									</Avatar>{' '}
									<div>
										<p className="text-sm font-semibold text-stone-900">
											{testimonial.name}
										</p>
										<p className="text-xs text-stone-500">{testimonial.role}</p>
									</div>
								</div>
							</div>
						</blockquote>
					</div>
				))}
			</div>
		</section>
	)
}
