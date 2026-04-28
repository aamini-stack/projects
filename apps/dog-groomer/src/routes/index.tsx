import { createFileRoute } from '@tanstack/react-router'
import {
	Scissors,
	Dog,
	Sparkles,
	Heart,
	Phone,
	MapPin,
	Star,
	CheckCircle2,
	Menu,
	X,
	Mail,
	ArrowRight,
	CalendarDays,
	Globe,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/')({
	component: Index,
})

const services = [
	{
		icon: Sparkles,
		title: 'Full Groom',
		desc: 'Complete bath, haircut, nail trim, and ear cleaning tailored to your breed.',
		price: 'Call for pricing',
	},
	{
		icon: Heart,
		title: 'Spa Bath',
		desc: 'Luxury shampoo, conditioner, blow dry, and brush-out for a silky finish.',
		price: 'Call for pricing',
	},
	{
		icon: Dog,
		title: 'Breed-Specific Cut',
		desc: 'Expert styling that matches breed standards or your custom preference.',
		price: 'Call for pricing',
	},
	{
		icon: Scissors,
		title: 'Nail & Paw Care',
		desc: 'Gentle nail trimming, paw pad cleaning, and moisturizing treatment.',
		price: 'Call for pricing',
	},
	{
		icon: Sparkles,
		title: 'De-Shedding',
		desc: 'Specialized treatment to reduce shedding by up to 90% for 4-6 weeks.',
		price: 'Call for pricing',
	},
	{
		icon: Heart,
		title: 'Puppy Package',
		desc: 'Gentle introduction to grooming for pups under 6 months.',
		price: 'Call for pricing',
	},
]

const testimonials = [
	{
		name: 'Sarah M.',
		pet: 'Winston the Corgi',
		stars: 5,
		text: "The attention to detail is unreal. Winston always comes home looking like a million bucks.",
	},
	{
		name: 'James T.',
		pet: 'Bentley the Poodle',
		stars: 5,
		text: "Finally, a groomer that treats my dog like family. The atmosphere is unmatched.",
	},
	{
		name: 'Maria L.',
		pet: 'Luna the Shih Tzu',
		stars: 5,
		text: "Luna used to hate grooming. Now she practically pulls me through the door.",
	},
]

function Navbar() {
	const [open, setOpen] = useState(false)

	return (
		<nav className="theme-bg-secondary/80 theme-border border-b backdrop-blur-md sticky top-0 z-50">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<a href="/" className="flex items-center gap-3">
					<img src="/images/logo.png" alt="Paw Paws Dog Grooming" className="h-10 w-10 rounded-full object-cover" />
					<span className="font-serif text-xl font-bold tracking-tight">
						Paw Paws
					</span>
				</a>

				<div className="hidden items-center gap-8 text-sm font-medium md:flex">
					<a href="/" className="theme-text-secondary hover:theme-accent-red transition-colors">Home</a>
					<a href="/services" className="theme-text-secondary hover:theme-accent-red transition-colors">Services</a>
					<a href="/gallery" className="theme-text-secondary hover:theme-accent-red transition-colors">Gallery</a>
					<a href="#contact" className="theme-text-secondary hover:theme-accent-red transition-colors">Contact</a>
				</div>

				<div className="hidden md:block">
					<a
						href="tel:5048104320"
						className="theme-bg-accent-red theme-text-inverse rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 inline-flex items-center gap-2"
					>
						<Phone className="h-4 w-4" />
						(504) 810-4320
					</a>
				</div>

				<button
					className="theme-text-primary md:hidden"
					onClick={() => setOpen(!open)}
					aria-label="Toggle menu"
				>
					{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			</div>

			{open && (
				<div className="theme-border border-t px-6 py-4 md:hidden">
					<div className="flex flex-col gap-3 text-sm font-medium">
						<a href="/" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Home</a>
						<a href="/services" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Services</a>
						<a href="/gallery" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Gallery</a>
						<a href="#contact" onClick={() => setOpen(false)} className="theme-text-secondary py-1">Contact</a>
						<a
							href="tel:5048104320"
							className="theme-bg-accent-red theme-text-inverse mt-2 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-center inline-flex items-center justify-center gap-2"
						>
							<Phone className="h-4 w-4" />
							(504) 810-4320
						</a>
					</div>
				</div>
			)}
		</nav>
	)
}

function Hero() {
	return (
		<header className="relative overflow-hidden">
			<div className="barber-stripes h-2 w-full" />
			<div className="theme-bg-secondary relative">
				<div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center md:flex-row md:gap-12 md:py-24 md:text-left">
					<div className="flex-1">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#b91c3a]/10 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase theme-accent-red">
							<Heart className="h-3.5 w-3.5" />
							Family-Owned in Kenner, LA
						</div>

						<h1 className="font-serif mb-6 text-5xl font-black leading-[1.1] md:text-6xl">
							At Paw Paw's,
							<br />
							<span className="theme-accent-gold">Our Puppies Are Family!</span>
						</h1>

						<p className="theme-text-secondary mx-auto mb-8 max-w-xl text-lg leading-relaxed md:mx-0">
							Professional grooming with a personal touch. Every dog that walks through
							our door gets the love and care they deserve.
						</p>

						<div className="flex flex-wrap justify-center gap-4 md:justify-start">
							<a
								href="tel:5048104320"
								className="theme-bg-accent-red theme-text-inverse rounded-full px-8 py-3.5 text-base font-bold shadow-lg shadow-[#b91c3a]/20 transition-transform hover:scale-[1.02] inline-flex items-center gap-2"
							>
								<Phone className="h-5 w-5" />
								Call (504) 810-4320
							</a>
							<a
								href="#contact"
								className="theme-border theme-text-primary rounded-full border-2 px-8 py-3.5 text-base font-bold transition-colors hover:bg-[#1a2744] hover:text-[#f2f0ec] inline-flex items-center gap-2"
							>
								<CalendarDays className="h-5 w-5" />
								Client Forms
							</a>
						</div>

						<div className="theme-text-secondary mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium md:justify-start">
							<span className="flex items-center gap-1.5">
								<CheckCircle2 className="theme-accent-gold h-3.5 w-3.5" />
								Experienced Groomers
							</span>
							<span className="flex items-center gap-1.5">
								<CheckCircle2 className="theme-accent-gold h-3.5 w-3.5" />
								All-Natural Products
							</span>
							<span className="flex items-center gap-1.5">
								<CheckCircle2 className="theme-accent-gold h-3.5 w-3.5" />
								Calm Environment
							</span>
						</div>
					</div>
					<div className="mt-12 w-full max-w-md md:mt-0 md:w-auto md:flex-1">
						<div className="theme-border relative overflow-hidden rounded-3xl border shadow-2xl">
							<img
								src="/images/dadys-puppy.jpg"
								alt="A happy dog getting a hug at Paw Paws Dog Grooming"
								className="h-full w-full object-cover"
								loading="eager"
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="barber-stripes h-2 w-full" />
		</header>
	)
}

function Services() {
	return (
		<section id="services" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
			<div className="mb-14 text-center">
				<p className="mb-2 text-xs font-bold tracking-widest uppercase theme-accent-red">
					Services
				</p>
				<h2 className="font-serif mb-3 text-4xl font-bold md:text-5xl">
					The Menu
				</h2>
				<p className="theme-text-secondary mx-auto max-w-lg">
					From quick tidy-ups to full spa days — every service is performed with
					patience, skill, and a pocket full of treats.
				</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{services.map(({ icon: Icon, title, desc, price }) => (
					<div
						key={title}
						className="theme-bg-secondary theme-border group relative overflow-hidden rounded-2xl border p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
					>
						<div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#b91c3a]/10">
							<Icon className="theme-accent-red h-6 w-6" />
						</div>
						<h3 className="mb-2 text-lg font-bold">{title}</h3>
						<p className="theme-text-secondary mb-5 text-sm leading-relaxed">
							{desc}
						</p>
						<div className="flex items-center justify-between">
							<span className="theme-accent-gold text-sm font-bold">{price}</span>
							<a
								href="tel:5048104320"
								className="theme-text-secondary text-xs font-semibold hover:theme-accent-red transition-colors"
							>
								Call to book →
							</a>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}

function Experience() {
	const perks = [
		{ title: 'Experienced Groomers', desc: 'Licensed professionals with years of hands-on experience caring for all breeds.' },
		{ title: 'All-Natural Products', desc: 'Premium shampoos and conditioners — no harsh chemicals on your pup.' },
		{ title: 'Calm Environment', desc: 'Low-stress atmosphere with plenty of patience and treats.' },
		{ title: 'Family Owned', desc: 'Local, independently owned shop where your dog is treated like family.' },
	]

	return (
		<section id="experience" className="theme-bg-secondary py-20 md:py-28">
			<div className="barber-stripes h-1.5 w-full" />
			<div className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
				<div className="mb-14 text-center">
					<p className="mb-2 text-xs font-bold tracking-widest uppercase theme-accent-red">
						The Experience
					</p>
					<h2 className="font-serif mb-3 text-4xl font-bold md:text-5xl">
						Why Paw Paws?
					</h2>
					<p className="theme-text-secondary mx-auto max-w-lg">
						We built this shop because dogs deserve the same care and craft
						that families have trusted for generations.
					</p>
				</div>

				<div className="grid gap-10 md:grid-cols-2 items-center">
					<div className="theme-border relative overflow-hidden rounded-3xl border shadow-xl">
						<img
							src="/images/randie-and-riley.jpg"
							alt="Randie and Riley with two happy Shelties at Paw Paws Dog Grooming"
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
					<div className="grid gap-8 sm:grid-cols-2">
						{perks.map((p, i) => (
							<div key={p.title} className="relative">
								<div className="theme-accent-gold mb-4 font-serif text-5xl font-black opacity-20">
									0{i + 1}
								</div>
								<h3 className="mb-2 text-lg font-bold">{p.title}</h3>
								<p className="theme-text-secondary text-sm leading-relaxed">{p.desc}</p>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="barber-stripes h-1.5 w-full mt-20" />
		</section>
	)
}

function Reviews() {
	return (
		<section id="reviews" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
			<div className="mb-14 text-center">
				<p className="mb-2 text-xs font-bold tracking-widest uppercase theme-accent-red">
					Testimonials
				</p>
				<h2 className="font-serif mb-3 text-4xl font-bold md:text-5xl">
					From the Pack
				</h2>
				<p className="theme-text-secondary mx-auto max-w-lg">
					Don't just take our word for it — hear from the humans who trust us
					with their best friends.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{testimonials.map((t) => (
					<div
						key={t.name}
						className="theme-bg-secondary theme-border relative rounded-2xl border p-7"
					>
						<div className="mb-4 flex gap-0.5">
							{Array.from({ length: t.stars }).map((_, i) => (
								<Star key={i} className="theme-accent-gold h-4 w-4 fill-current" />
							))}
						</div>
						<p className="theme-text-primary mb-6 text-sm leading-relaxed">
							"{t.text}"
						</p>
						<div>
							<p className="text-sm font-bold">{t.name}</p>
							<p className="theme-text-secondary text-xs">{t.pet}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}

function Location() {
	return (
		<section className="theme-bg-secondary py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6">
				<div className="mb-14 text-center">
					<p className="mb-2 text-xs font-bold tracking-widest uppercase theme-accent-red">
						Visit Us
					</p>
					<h2 className="font-serif mb-3 text-4xl font-bold md:text-5xl">
						Location & Hours
					</h2>
				</div>

				<div className="grid gap-8 md:grid-cols-2">
					<div className="theme-bg-primary theme-border rounded-2xl border p-8">
						<h3 className="font-serif mb-6 text-2xl font-bold">Paw Paws Dog Grooming, LLC</h3>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<MapPin className="theme-accent-red mt-0.5 h-5 w-5 shrink-0" />
								<div>
									<p className="text-sm font-medium">1954 Indiana Avenue</p>
									<p className="theme-text-secondary text-sm">Kenner, LA 70062</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Phone className="theme-accent-red h-5 w-5 shrink-0" />
								<a href="tel:5048104320" className="text-sm font-medium hover:theme-accent-red transition-colors">
									(504) 810-4320
								</a>
							</div>
							<div className="flex items-center gap-3">
								<Mail className="theme-accent-red h-5 w-5 shrink-0" />
								<a href="mailto:pawpawsdoggrooming@outlook.com" className="text-sm font-medium hover:theme-accent-red transition-colors">
									pawpawsdoggrooming@outlook.com
								</a>
							</div>
						</div>

						<div className="theme-border mt-8 border-t pt-6">
							<h4 className="mb-3 text-sm font-bold">Hours</h4>
							<div className="space-y-1.5 text-sm">
								<div className="flex justify-between">
									<span className="theme-text-secondary">Monday – Friday</span>
									<span className="font-medium">9:00 AM – 5:00 PM</span>
								</div>
								<div className="flex justify-between">
									<span className="theme-text-secondary">Saturday</span>
									<span className="font-medium">Closed</span>
								</div>
								<div className="flex justify-between">
									<span className="theme-text-secondary">Sunday</span>
									<span className="font-medium">Closed</span>
								</div>
							</div>
						</div>
					</div>

					<div className="theme-border relative overflow-hidden rounded-2xl border">
						<iframe
							title="Paw Paws Dog Grooming Location"
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.3!2d-90.25!3d29.99!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8620a0!2s1954+Indiana+Ave%2C+Kenner%2C+LA+70062!5e0!3m2!1sen!2sus!4v1"
							width="100%"
							height="100%"
							style={{ border: 0, minHeight: '360px' }}
							allowFullScreen
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						/>
					</div>
				</div>
			</div>
		</section>
	)
}

function ContactCTA() {
	return (
		<section id="contact" className="theme-bg-accent py-20 md:py-28 relative">
			<div className="barber-stripes-vertical absolute left-0 top-0 h-full w-1.5 opacity-30" />
			<div className="mx-auto max-w-6xl px-6 text-center">
				<div className="theme-bg-accent-red/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
					<Scissors className="theme-text-inverse h-8 w-8" />
				</div>
				<h2 className="font-serif theme-text-inverse mb-4 text-4xl font-bold md:text-5xl">
					Ready to Join the Family?
				</h2>
				<p className="theme-text-inverse mx-auto mb-10 max-w-lg text-lg opacity-70">
					New clients can fill out our form before arriving. Returning clients,
					we've got you covered too.
				</p>
				<div className="flex flex-wrap justify-center gap-4">
					<a
						href="#"
						className="theme-bg-accent-gold theme-text-primary rounded-full px-8 py-3.5 text-base font-bold shadow-lg transition-transform hover:scale-[1.02] inline-flex items-center gap-2"
					>
						<ArrowRight className="h-5 w-5" />
						New Client Form
					</a>
					<a
						href="#"
						className="theme-border theme-text-inverse rounded-full border-2 px-8 py-3.5 text-base font-bold transition-colors hover:bg-white hover:text-[#1a2744] inline-flex items-center gap-2"
					>
						<ArrowRight className="h-5 w-5" />
						Returning Client Form
					</a>
				</div>
			</div>
		</section>
	)
}

function Footer() {
	return (
		<footer className="theme-bg-primary theme-border border-t py-10">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
				<div className="flex items-center gap-2">
					<img src="/images/logo.png" alt="Paw Paws" className="h-8 w-8 rounded-full object-cover" />
					<span className="font-serif text-sm font-bold">Paw Paws Dog Grooming, LLC</span>
				</div>
				<p className="theme-text-secondary text-xs">
					© {new Date().getFullYear()} Paw Paws Dog Grooming, LLC. All rights reserved.
				</p>
				<div className="flex items-center gap-5">
					<a href="mailto:pawpawsdoggrooming@outlook.com" className="theme-text-secondary hover:theme-accent-red transition-colors" aria-label="Email">
						<Mail className="h-5 w-5" />
					</a>
					<a href="#" className="theme-text-secondary hover:theme-accent-red transition-colors" aria-label="Facebook">
						<Globe className="h-5 w-5" />
					</a>
				</div>
			</div>
		</footer>
	)
}

function Index() {
	return (
		<div className="min-h-screen theme-bg-primary">
			<Navbar />
			<Hero />
			<Services />
			<Experience />
			<Reviews />
			<Location />
			<ContactCTA />
			<Footer />
		</div>
	)
}
