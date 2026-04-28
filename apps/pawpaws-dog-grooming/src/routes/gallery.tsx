import { createFileRoute } from '@tanstack/react-router'
import { Menu, X, ArrowLeft, Camera } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/gallery')({
	component: GalleryPage,
})

const galleryImages = [
	{
		id: 1,
		src: '/images/randie-and-riley.jpg',
		alt: 'Randie and Riley with two happy Shelties',
		size: 'large',
	},
	{
		id: 2,
		src: '/images/dadys-puppy.jpg',
		alt: 'A happy pup getting some love',
		size: 'medium',
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
						href="/#contact"
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
							href="/#contact"
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

function GalleryPage() {
	return (
		<div className="theme-bg-primary min-h-screen">
			<Navbar />

			<header className="relative overflow-hidden">
				<div className="barber-stripes h-2 w-full" />
				<div className="theme-bg-secondary">
					<div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-20">
						<a
							href="/"
							className="theme-text-secondary hover:theme-accent-red mb-4 inline-flex items-center gap-1 text-sm transition-colors"
						>
							<ArrowLeft className="h-4 w-4" /> Back to Home
						</a>
						<h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl">
							Gallery
						</h1>
						<p className="theme-text-secondary mx-auto max-w-lg">
							A glimpse into our shop — happy dogs, fresh cuts, and the faces
							behind the scissors.
						</p>
					</div>
				</div>
				<div className="barber-stripes h-2 w-full" />
			</header>

			<main className="mx-auto max-w-6xl px-6 py-16 md:py-20">
				<div className="theme-text-secondary mb-10 flex items-center justify-center gap-2 text-sm">
					<Camera className="h-4 w-4" />
					<span>More photos coming soon!</span>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{galleryImages.map((img) => (
						<div
							key={img.id}
							className="theme-border group relative overflow-hidden rounded-3xl border"
						>
							<img
								src={img.src}
								alt={img.alt}
								className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
								loading="lazy"
							/>
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
								<p className="text-sm font-medium text-white">{img.alt}</p>
							</div>
						</div>
					))}
				</div>
			</main>

			<footer className="theme-bg-primary theme-border border-t py-10">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
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
						© {new Date().getFullYear()} All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	)
}
