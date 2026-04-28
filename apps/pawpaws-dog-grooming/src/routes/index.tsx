import { createFileRoute } from '@tanstack/react-router'
import {
	Scissors,
	Dog,
	Sparkles,
	Heart,
	Phone,
	MapPin,
	CheckCircle2,
	Menu,
	X,
	Mail,
	ArrowRight,
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
		desc: 'Complete bath, haircut, nail trim, ear cleaning, and anal gland expression. Tailored to your breed and preferences.',
		includes: [
			'Bath & blow dry',
			'Haircut / trim',
			'Nail trim',
			'Ear cleaning',
			'Anal glands',
		],
	},
	{
		icon: Heart,
		title: 'Spa Bath',
		desc: 'Luxury shampoo, deep conditioner, blow dry, and thorough brush-out for a silky, shiny finish.',
		includes: [
			'Premium shampoo',
			'Deep conditioning',
			'Blow dry & brush-out',
			'Paw pad trim',
			'Sanitary trim',
		],
	},
	{
		icon: Dog,
		title: 'Breed-Specific Cut',
		desc: 'Expert styling that matches AKC breed standards or your own custom look.',
		includes: [
			'Breed-standard pattern',
			'Hand scissoring',
			'Finishing spray',
			'Bandana or bow',
		],
	},
	{
		icon: Scissors,
		title: 'Nail & Paw Care',
		desc: 'Gentle nail trimming, paw pad cleaning, and moisturizing treatment to keep paws healthy.',
		includes: [
			'Nail trim & file',
			'Paw pad shave',
			'Paw balm treatment',
			'Nail grind (optional)',
		],
	},
	{
		icon: Sparkles,
		title: 'De-Shedding Treatment',
		desc: 'Specialized treatment to reduce shedding by up to 90% for 4–6 weeks. Great for double-coated breeds.',
		includes: [
			'De-shedding shampoo',
			'High-velocity dry',
			'Undercoat rake',
			'Finishing brush-out',
		],
	},
	{
		icon: Heart,
		title: 'Puppy Package',
		desc: 'Gentle introduction to grooming for pups under 6 months. Builds positive associations for life.',
		includes: [
			'Gentle bath',
			'Light trim',
			'Nail trim',
			'Lots of treats & praise',
			'Gradual desensitization',
		],
	},
]

function Navbar() {
	const [open, setOpen] = useState(false)

	return (
		<nav className="theme-bg-secondary/80 theme-border sticky top-0 z-50 border-b backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
				<a href="/" className="flex items-center gap-3">
					<img
						src="/images/logo.png"
						alt="Paw Paws Dog Grooming"
						className="h-10 w-10 rounded-full object-cover"
					/>
					<span className="font-serif text-xl font-bold tracking-tight">
						Paw Paws
					</span>
				</a>

				<div className="hidden items-center gap-8 text-sm font-medium md:flex">
					<a
						href="/"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
					>
						Home
					</a>
					<a
						href="/#services"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
					>
						Services
					</a>
					<a
						href="/gallery"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
					>
						Gallery
					</a>
					<a
						href="#contact"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
					>
						Contact
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
						<a
							href="/"
							onClick={() => setOpen(false)}
							className="theme-text-secondary py-1"
						>
							Home
						</a>
						<a
							href="/#services"
							onClick={() => setOpen(false)}
							className="theme-text-secondary py-1"
						>
							Services
						</a>
						<a
							href="/gallery"
							onClick={() => setOpen(false)}
							className="theme-text-secondary py-1"
						>
							Gallery
						</a>
						<a
							href="#contact"
							onClick={() => setOpen(false)}
							className="theme-text-secondary py-1"
						>
							Contact
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
				<div className="mx-auto flex max-w-6xl flex-row items-center gap-4 px-8 py-16 text-center md:gap-12 md:px-6 md:py-24 md:text-left">
					<div className="min-w-0 flex-1">
						<h1 className="mb-6 font-serif text-5xl leading-[1.1] font-black md:text-6xl">
							At Paw Paw's,
							<br />
							<span className="theme-accent-gold">Our Puppies Are Family!</span>
						</h1>

						<p className="theme-text-secondary mx-auto mb-8 max-w-xl text-lg leading-relaxed md:mx-0">
							Professional grooming with a personal touch. Every dog that walks
							through our door gets the love and care they deserve.
						</p>

						<div className="flex min-w-0 flex-row items-stretch justify-center gap-3 md:justify-start">
							<a
								href="https://paw-paws-dog-grooming-llc.square.site/new-client-form"
								target="_blank"
								rel="noopener noreferrer"
								className="theme-bg-accent-red theme-text-inverse inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold shadow-lg shadow-[#b91c3a]/20 transition-transform hover:scale-[1.02] md:px-8 md:py-3.5 md:text-base"
							>
								<ArrowRight className="h-5 w-5" />
								New Client Form
							</a>
							<a
								href="https://paw-paws-dog-grooming-llc.square.site/returning-client-form"
								target="_blank"
								rel="noopener noreferrer"
								className="theme-border theme-text-primary inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-bold transition-colors hover:border-[#b91c3a] hover:bg-[#b91c3a] hover:text-white md:px-8 md:py-3.5 md:text-base"
							>
								<ArrowRight className="h-5 w-5" />
								Returning Client Form
							</a>
						</div>

						<div className="theme-text-secondary mx-auto mt-8 flex w-fit flex-row flex-wrap justify-center gap-x-4 gap-y-2 text-left text-xs font-medium md:mx-0 md:justify-start">
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
							<span className="flex items-center gap-1.5">
								<CheckCircle2 className="theme-accent-gold h-3.5 w-3.5" />
								Family Owned in Kenner, LA
							</span>
						</div>
					</div>
					<div className="mt-8 w-44 shrink-0 sm:w-52 md:mt-0 md:w-[420px] md:max-w-none md:shrink-0">
						<div className="theme-border relative overflow-hidden rounded-3xl border shadow-2xl">
							<img
								src="/images/dadys-puppy.jpg"
								alt="A happy dog getting a hug at Paw Paws Dog Grooming"
								className="h-auto w-full object-contain"
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
				<p className="theme-accent-red mb-2 text-xs font-bold tracking-widest uppercase">
					Services
				</p>
				<h2 className="mb-3 font-serif text-4xl font-bold md:text-5xl">
					The Menu
				</h2>
				<p className="theme-text-secondary mx-auto max-w-lg">
					From quick tidy-ups to full spa days — every service is performed with
					patience, skill, and a pocket full of treats.
				</p>
			</div>

			<div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 sm:gap-6">
				{services.map(({ icon: Icon, title, desc, includes }) => (
					<div
						key={title}
						className="theme-bg-secondary theme-border group relative overflow-hidden rounded-xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
					>
						<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#b91c3a]/10">
							<Icon className="theme-accent-red h-5 w-5" />
						</div>
						<h3 className="mb-2 text-lg font-bold">{title}</h3>
						<p className="theme-text-secondary mb-4 text-sm leading-relaxed">
							{desc}
						</p>
						<ul className="mb-4 space-y-1.5">
							{includes.map((item) => (
								<li key={item} className="flex items-center gap-2 text-sm">
									<span className="theme-accent-gold text-xs">✓</span>
									<span className="theme-text-secondary">{item}</span>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</section>
	)
}

function Experience() {
	const perks = [
		{
			title: 'Experienced Groomers',
			desc: 'Licensed professionals with years of hands-on experience caring for all breeds.',
		},
		{
			title: 'All-Natural Products',
			desc: 'Premium shampoos and conditioners — no harsh chemicals on your pup.',
		},
		{
			title: 'Calm Environment',
			desc: 'Low-stress atmosphere with plenty of patience and treats.',
		},
		{
			title: 'Family Owned',
			desc: 'Local, independently owned shop where your dog is treated like family.',
		},
	]

	return (
		<section id="experience" className="theme-bg-secondary py-20 md:py-28">
			<div className="barber-stripes h-1.5 w-full" />
			<div className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
				<div className="mb-14 text-center">
					<p className="theme-accent-red mb-2 text-xs font-bold tracking-widest uppercase">
						The Experience
					</p>
					<h2 className="mb-3 font-serif text-4xl font-bold md:text-5xl">
						Why Paw Paws?
					</h2>
					<p className="theme-text-secondary mx-auto max-w-lg">
						We built this shop because dogs deserve the same care and craft that
						families have trusted for generations.
					</p>
				</div>

				<div className="grid items-center gap-10 md:grid-cols-2">
					<div className="theme-border relative overflow-hidden rounded-3xl border shadow-xl">
						<img
							src="/images/randie-and-riley.jpg"
							alt="Randie and Riley with two happy Shelties at Paw Paws Dog Grooming"
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4 sm:gap-8">
						{perks.map((p, i) => (
							<div key={p.title} className="relative min-w-0">
								<div className="theme-accent-gold mb-2 font-serif text-4xl font-black opacity-20 md:mb-4 md:text-5xl">
									0{i + 1}
								</div>
								<h3 className="mb-2 text-sm font-bold md:text-lg">{p.title}</h3>
								<p className="theme-text-secondary text-xs leading-relaxed md:text-sm">
									{p.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="barber-stripes mt-20 h-1.5 w-full" />
		</section>
	)
}

function Location() {
	return (
		<section className="theme-bg-secondary py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6">
				<div className="mb-14 text-center">
					<p className="theme-accent-red mb-2 text-xs font-bold tracking-widest uppercase">
						Visit Us
					</p>
					<h2 className="mb-3 font-serif text-4xl font-bold md:text-5xl">
						Location & Hours
					</h2>
				</div>

				<div className="grid gap-8 md:grid-cols-2">
					<div className="theme-bg-primary theme-border rounded-2xl border p-8">
						<h3 className="mb-6 font-serif text-2xl font-bold">
							Paw Paws Dog Grooming, LLC
						</h3>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<MapPin className="theme-accent-red mt-0.5 h-5 w-5 shrink-0" />
								<div>
									<p className="text-sm font-medium">1954 Indiana Avenue</p>
									<p className="theme-text-secondary text-sm">
										Kenner, LA 70062
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Phone className="theme-accent-red h-5 w-5 shrink-0" />
								<a
									href="tel:5048104320"
									className="hover:theme-accent-red text-sm font-medium transition-colors"
								>
									(504) 810-4320
								</a>
							</div>
							<div className="flex items-center gap-3">
								<Mail className="theme-accent-red h-5 w-5 shrink-0" />
								<a
									href="mailto:pawpawsdoggrooming@outlook.com"
									className="hover:theme-accent-red text-sm font-medium transition-colors"
								>
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
		<section id="contact" className="theme-bg-accent relative py-20 md:py-28">
			<div className="barber-stripes-vertical absolute top-0 left-0 h-full w-1.5 opacity-30" />
			<div className="mx-auto max-w-6xl px-6 text-center">
				<div className="theme-bg-accent-red/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
					<Scissors className="theme-text-inverse h-8 w-8" />
				</div>
				<h2 className="theme-text-inverse mb-4 font-serif text-4xl font-bold md:text-5xl">
					Ready to Join the Family?
				</h2>
				<p className="theme-text-inverse mx-auto mb-10 max-w-lg text-lg opacity-70">
					New clients can fill out our form before arriving. Returning clients,
					we've got you covered too.
				</p>
				<div className="flex flex-wrap justify-center gap-4">
					<a
						href="https://paw-paws-dog-grooming-llc.square.site/new-client-form"
						target="_blank"
						rel="noopener noreferrer"
						className="theme-bg-accent-gold theme-text-primary inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-base font-bold shadow-lg transition-transform hover:scale-[1.02]"
					>
						<ArrowRight className="h-5 w-5" />
						New Client Form
					</a>
					<a
						href="https://paw-paws-dog-grooming-llc.square.site/returning-client-form"
						target="_blank"
						rel="noopener noreferrer"
						className="theme-border theme-text-inverse inline-flex items-center gap-2 rounded-lg border-2 px-8 py-3.5 text-base font-bold transition-colors hover:bg-white hover:text-[#1a2744]"
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
					<img
						src="/images/logo.png"
						alt="Paw Paws"
						className="h-8 w-8 rounded-full object-cover"
					/>
					<span className="font-serif text-sm font-bold">
						Paw Paws Dog Grooming, LLC
					</span>
				</div>
				<p className="theme-text-secondary text-xs">
					© {new Date().getFullYear()} Paw Paws Dog Grooming, LLC. All rights
					reserved.
				</p>
				<div className="flex items-center gap-5">
					<a
						href="mailto:pawpawsdoggrooming@outlook.com"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
						aria-label="Email"
					>
						<Mail className="h-5 w-5" />
					</a>
					<a
						href="https://www.facebook.com/PawPawsPuppyParlor"
						className="theme-text-secondary hover:theme-accent-red transition-colors"
						aria-label="Facebook"
					>
						<Globe className="h-5 w-5" />
					</a>
				</div>
			</div>
		</footer>
	)
}

function Index() {
	return (
		<div className="theme-bg-primary min-h-screen">
			<Navbar />
			<Hero />
			<Services />
			<Experience />
			<Location />
			<ContactCTA />
			<Footer />
		</div>
	)
}
