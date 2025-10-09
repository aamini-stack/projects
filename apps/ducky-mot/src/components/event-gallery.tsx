import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import type { EventGallery } from '#/lib/galleries'

type EventGalleryProps = {
	gallery: EventGallery
}

export function EventGallery({ gallery }: EventGalleryProps) {
	const [selectedImage, setSelectedImage] = useState<
		EventGallery['images'][0] | null
	>(null)

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
			{/* Header with back navigation */}
			<div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
				<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					<a
						href="/#duckyevents"
						className="group inline-flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
					>
						<ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
						<span>Back to Events</span>
					</a>
				</div>
			</div>

			{/* Event Header */}
			<div className="border-b border-gray-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="text-center">
						<h1 className="mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl lg:text-6xl">
							{gallery.eventTitle}
						</h1>
						<p className="text-xl text-gray-400 md:text-2xl">
							{gallery.eventDate}
						</p>
					</div>
				</div>
			</div>

			{/* Gallery Grid */}
			<div className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{gallery.images.map((image, index) => (
							<button
								type="button"
								key={image.id}
								className="group relative aspect-square transform cursor-pointer overflow-hidden rounded-xl bg-gray-800 transition-all duration-500 hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
								onClick={() => setSelectedImage(image)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault()
										setSelectedImage(image)
									}
								}}
								tabIndex={0}
								aria-label={`View ${image.alt} in full size`}
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<img
									src={image.thumbnail || image.src}
									alt={image.alt}
									className="h-full w-full object-cover transition-all duration-500 group-hover:brightness-110"
									loading="lazy"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
								<div className="absolute inset-0 rounded-xl ring-2 ring-blue-400/0 transition-all duration-500 group-hover:ring-blue-400/30" />
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Lightbox Modal */}
			{selectedImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
					onClick={() => setSelectedImage(null)}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							setSelectedImage(null)
						}
					}}
					role="dialog"
					aria-modal="true"
					aria-label="Image preview modal"
				>
					<div className="relative max-h-[90vh] max-w-6xl">
						<img
							src={selectedImage.src}
							alt={selectedImage.alt}
							className="h-auto max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
						/>
						{/* Close button */}
						<button
							type="button"
							className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
							onClick={(e) => {
								e.stopPropagation()
								setSelectedImage(null)
							}}
							aria-label="Close image preview"
						>
							<svg
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<title>Close</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
						{/* Image caption */}
						{selectedImage.alt && (
							<div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/60 p-4 backdrop-blur-sm">
								<p className="text-lg font-medium text-white">
									{selectedImage.alt}
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
