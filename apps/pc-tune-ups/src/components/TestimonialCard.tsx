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
		<blockquote className="relative rounded-2xl border border-[#E1D4B6] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C75C2F]/40 hover:shadow-lg hover:shadow-[#E3B493]/40">
			<div className="absolute right-4 top-4 text-4xl text-[#F0CBB0]">"</div>
			<div className="space-y-4">
				<p className="relative z-10 text-base leading-relaxed text-[#4F4A3F]">
					{quote}
				</p>
				<div className="flex items-center gap-3 border-t border-[#F0E3C7] pt-2">
					<Avatar className="h-10 w-10">
						<AvatarImage src={avatar} alt={`${name} avatar`} />
						<AvatarFallback className="bg-[#F9DCC4] font-semibold text-[#C75C2F]">
							{initial}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-sm font-semibold text-[#2D2A26]">{name}</p>
						<p className="text-xs text-[#6B655A]">{role}</p>
					</div>
				</div>
			</div>
		</blockquote>
	)
}
