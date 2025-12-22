import { StorePhotos } from '@/components/store-photos'
import { Mail, Phone } from 'lucide-react'

export function Hero() {
	return (
		<section className="space-y-8 rounded-3xl bg-linear-to-br from-white via-lime-50 to-stone-50 p-4 shadow-xl ring-1 shadow-stone-200/60 ring-lime-100 sm:p-6 md:p-8 lg:p-10">
			<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
				<div className="order-1 space-y-6">
					{/* STORE LOGO */}
					<div className="flex items-center gap-4">
						<img
							src="/logo.png"
							alt="PC Tune-Ups vintage computer illustration"
							className="h-24 items-start object-contain object-left"
							width="1024"
							height="1024"
							decoding="async"
						/>
					</div>

					{/* DESCRIPTION */}
					<p className="max-w-3xl text-xl leading-relaxed text-stone-700 sm:text-2xl">
						Your neighborhood team for fast, friendly computer and device repair
						in the Greater New Orleans area—with{' '}
						<span className="font-semibold text-lime-700">10+ years</span> of
						hands-on experience.
					</p>

					{/* CALL/EMAIL BUTTONS */}
					<div className="flex flex-wrap gap-4 pt-4">
						<a
							href="tel:15048851635"
							className="inline-flex items-center gap-2 rounded-full bg-lime-500 px-7 py-3 text-lg font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-lime-600 hover:shadow-lg hover:shadow-lime-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
						>
							<Phone className="h-6 w-6" />
							<span>Call Now</span>
						</a>
						<a
							href="mailto:info@afcom-inc.com"
							className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3 text-lg font-semibold text-stone-900 transition-all duration-200 hover:-translate-y-px hover:bg-lime-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
						>
							<Mail className="h-6 w-6 text-lime-600" />
							<span>Email Us</span>
						</a>
					</div>
				</div>

				{/* PHOTO CAROUSEL */}
				<div className="order-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-300/40">
					<StorePhotos />
				</div>
			</div>
		</section>
	)
}
