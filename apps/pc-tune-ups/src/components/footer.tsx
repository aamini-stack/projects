const currentYear = new Date().getFullYear()

const socialLinks = [
	{
		name: 'Facebook',
		href: 'https://www.facebook.com/PCTuneUps365/',
		label: 'Fb',
	},
	{ name: 'Twitter', href: 'https://twitter.com/pctuneups', label: 'X' },
	{
		name: 'Instagram',
		href: 'https://www.instagram.com/pc_tuneups/',
		label: 'Ig',
	},
	{
		name: 'LinkedIn',
		href: 'https://www.linkedin.com/company/pctuneups',
		label: 'In',
	},
	{
		name: 'YouTube',
		href: 'https://www.youtube.com/channel/UCLBMfHkUR9qu9WyNBGigPlg',
		label: 'YT',
	},
]

export default function Footer() {
	return (
		<footer className="border-t border-stone-200 bg-white/90 backdrop-blur-sm">
			<div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
				<div className="space-y-2">
					<p className="text-base font-semibold text-stone-900">PC Tune-Ups</p>
					<p>© {currentYear} PC Tune-Ups. All rights reserved.</p>
				</div>
				<div className="flex flex-wrap items-center gap-4">
					{socialLinks.map(({ name, href, label }) => (
						<a
							key={name}
							className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-500/40 hover:bg-lime-50 hover:text-lime-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
							href={href}
							target="_blank"
							rel="noreferrer"
							aria-label={name}
						>
							<span className="text-xs font-semibold tracking-wide uppercase">
								{label}
							</span>
						</a>
					))}
				</div>
			</div>
		</footer>
	)
}
