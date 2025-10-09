interface TestimonialCardProps {
	quote: string
	name: string
	role: string
	initial: string
}

export function TestimonialCard({
	quote,
	name,
	role,
	initial,
}: TestimonialCardProps) {
	return (
		<blockquote className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 transition-all duration-300 hover:border-emerald-200/30 hover:shadow-lg hover:shadow-emerald-200/5">
			<div className="absolute right-4 top-4 text-4xl text-emerald-200/20">
				"
			</div>
			<div className="space-y-4">
				<p className="relative z-10 text-base leading-relaxed text-white/90">
					{quote}
				</p>
				<div className="flex items-center gap-3 border-t border-white/10 pt-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/10 font-semibold text-emerald-200">
						{initial}
					</div>
					<div>
						<p className="text-sm font-semibold text-white">{name}</p>
						<p className="text-xs text-white/60">{role}</p>
					</div>
				</div>
			</div>
		</blockquote>
	)
}
