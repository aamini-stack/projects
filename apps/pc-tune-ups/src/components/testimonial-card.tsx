import { Avatar, AvatarFallback, AvatarImage } from '@aamini/ui/components'

interface TestimonialCardProps {
	quote: string
	name: string
	role: string
	initial: string
	avatar?: string
}

export function TestimonialCard({
	quote,
	name,
	role,
	initial,
	avatar,
}: TestimonialCardProps) {
	return (
		<blockquote className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
			<div className="absolute right-4 top-4 text-4xl text-amber-200">"</div>
			<div className="space-y-4">
				<p className="relative z-10 text-base leading-relaxed text-stone-600 sm:text-lg">
					{quote}
				</p>
				<div className="flex items-center gap-3 border-t border-stone-200 pt-2">
					<Avatar className="h-10 w-10">
						<AvatarImage src={avatar} alt={`${name} avatar`} />
						<AvatarFallback className="bg-amber-50 font-semibold text-amber-700">
							{initial}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-sm font-semibold text-stone-900">{name}</p>
						<p className="text-xs text-stone-500">{role}</p>
					</div>
				</div>
			</div>
		</blockquote>
	)
}
