import { createFileRoute } from '@tanstack/react-router'
import {
	Scissors,
	Sparkles,
	Heart,
	Dog,
	Phone,
	Menu,
	X,
	ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/services')({
	component: ServicesPage,
})

const groomingServices = [
	{
		icon: Sparkles,
		title: 'Full Groom',
		desc: 'Complete bath, haircut, nail trim, ear cleaning, and anal gland expression. Tailored to your breed and preferences.',
		includes: ['Bath & blow dry', 'Haircut / trim', 'Nail trim', 'Ear cleaning', 'Anal glands'],
	},
	{
		icon: Heart,
		title: 'Spa Bath',
		desc: 'Luxury shampoo, deep conditioner, blow dry, and thorough brush-out for a silky, shiny finish.',
		includes: ['Premium shampoo', 'Deep conditioning', 'Blow dry & brush-out', 'Paw pad trim', 'Sanitary trim'],
	},
	{
		icon: Dog,
		title: 'Breed-Specific Cut',
		desc: 'Expert styling that matches AKC breed standards or your own custom look.',
		includes: ['Breed-standard pattern', 'Hand scissoring', 'Finishing spray', 'Bandana or bow'],
	},
	{
		icon: Scissors,
		title: 'Nail & Paw Care',
		desc: 'Gentle nail trimming, paw pad cleaning, and moisturizing treatment to keep paws healthy.',
		includes: ['Nail trim & file', 'Paw pad shave', 'Paw balm treatment', 'Nail grind (optional)'],
	},
	{
		icon: Sparkles,
		title: 'De-Shedding Treatment',
		desc: 'Specialized treatment to reduce shedding by up to 90% for 4–6 weeks. Great for double-coated breeds.',
		includes: ['De-shedding shampoo', 'High-velocity dry', 'Undercoat rake', 'Finishing brush-out'],
	},
	{
		icon: Heart,
		title: 'Puppy Package',
		desc: 'Gentle introduction to grooming for pups under 6 months. Builds positive associations for life.',
		includes: ['Gentle bath', 'Light trim', 'Nail trim', 'Lots of treats & praise', 'Gradual desensitization'],
	},
]

function Navbar() {
	const [open, setOpen] = useState(false)
	return (
		<nav className="theme-bg-secondary/80 theme-border border-b backdrop-blur-md sticky top-0 z-50">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="theme-bg-accent-red flex h-10 w-10 items-center justify-center rounded-full">
						<Dog className="h-5 w-5 text-white" />
					</div>
					<a href="/" className="font-serif text-xl font-bold tracking-tight">Paw Paws</a>
				</div>

				<div className="hidden items-center gap-8 text-sm font-medium md:flex">
					<a href="/" className="theme-text-secondary hover:theme-accent-red transition-colors">Home</a>
					<a href="/services" className="theme-text-secondary hover:theme-accent-red transition-colors">Services</a>
					<a href="/gallery" className="theme-text-secondary hover:theme-accent-red transition-colors">Gallery</a>
					<a href="/#contact" className="theme-text-secondary hover:theme-accent-red transition-colors">Contact</a>
				</div>

				<div className="hidden md:block">
					<a href="tel:5048104320" className="theme-bg-accent-red theme-text-inverse rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-2">
						<Phone className="h-4 w-4" /> (504) 810-4320
					</a>
				</div>

				<button className="theme-text-primary md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
					{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			</div>

			{open && (
				<div className="theme-border border-t px-6 py-4 md:hidden">
					<div className="flex flex-col gap-3 text-sm font-medium">
						<a href="/" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Home</a>
						<a href="/services" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Services</a>
						<a href="/gallery" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Gallery</a>
						<a href="/#contact" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Contact</a>
						<a href="tel:5048104320" className="theme-bg-accent-red theme-text-inverse mt-2 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-center inline-flex items-center justify-center gap-2">
							<Phone className="h-4 w-4" /> (504) 810-4320
						</a>
					</div>
				</div>
			)}
		</nav>
	)
}

function ServicesPage() {
	return (
		<div className="min-h-screen theme-bg-primary">
			<Navbar />

			<header className="relative overflow-hidden">
				<div className="barber-stripes h-2 w-full" />
				<div className="theme-bg-secondary">
					<div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
						<a href="/" className="theme-text-secondary mb-4 inline-flex items-center gap-1 text-sm hover:theme-accent-red transition-colors">
							<ArrowLeft className="h-4 w-4" /> Back to Home
						</a>
						<h1 className="font-serif mb-4 text-4xl font-bold md:text-5xl">Services & Pricing</h1>
						<p className="theme-text-secondary mx-auto max-w-lg">
							Every dog is different. Call us for a personalized quote based on breed, size, and coat condition.
						</p>
					</div>
				</div>
				<div className="barber-stripes h-2 w-full" />
			</header>

			<main className="mx-auto max-w-6xl px-6 py-16 md:py-20">
				<div className="grid gap-8 md:grid-cols-2">
					{groomingServices.map(({ icon: Icon, title, desc, includes }) => (
						<div key={title} className="theme-bg-secondary theme-border rounded-2xl border p-8">
							<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#b91c3a]/10">
								<Icon className="theme-accent-red h-6 w-6" />
							</div>
							<h3 className="mb-2 text-xl font-bold">{title}</h3>
							<p className="theme-text-secondary mb-5 text-sm leading-relaxed">{desc}</p>
							<ul className="space-y-2">
								{includes.map((item) => (
									<li key={item} className="flex items-center gap-2 text-sm">
										<span className="theme-accent-gold">✓</span>
										{item}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="theme-bg-accent theme-text-inverse mt-12 rounded-2xl p-8 text-center md:p-12">
					<h3 className="font-serif mb-3 text-2xl font-bold">Not sure what your pup needs?</h3>
					<p className="theme-text-inverse/70 mb-6">
						Give us a call and we'll recommend the perfect service for your dog's breed and lifestyle.
					</p>
					<a href="tel:5048104320" className="theme-bg-accent-gold theme-text-primary inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold transition-transform hover:scale-[1.02]">
						<Phone className="h-5 w-5" /> Call (504) 810-4320
					</a>
				</div>
			</main>

			<footer className="theme-bg-primary theme-border border-t py-10">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
					<div className="flex items-center gap-2">
					<img src="/images/logo.png" alt="Paw Paws" className="h-8 w-8 rounded-full object-cover" />
						<span className="font-serif text-sm font-bold">Paw Paws Dog Grooming, LLC</span>
					</div>
					<p className="theme-text-secondary text-xs">© {new Date().getFullYear()} All rights reserved.</p>
				</div>
			</footer>
		</div>
	)
}
