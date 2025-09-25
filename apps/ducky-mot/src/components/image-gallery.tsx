import { useState } from 'react'

interface GalleryImage {
	id: number
	src: string
	alt: string
	category: string
}

// Using Pexels images as specified in the design guidelines
const galleryImages: GalleryImage[] = [
	{
		id: 1,
		src: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Festival crowd enjoying music',
		category: 'crowd',
	},
	{
		id: 2,
		src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Live performance on stage',
		category: 'performance',
	},
	{
		id: 3,
		src: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Festival lights and atmosphere',
		category: 'atmosphere',
	},
	{
		id: 4,
		src: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Musicians performing',
		category: 'performance',
	},
	{
		id: 5,
		src: 'https://images.pexels.com/photos/1769547/pexels-photo-1769547.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Festival crowd at night',
		category: 'crowd',
	},
	{
		id: 6,
		src: 'https://images.pexels.com/photos/2747448/pexels-photo-2747448.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Stage lighting effects',
		category: 'atmosphere',
	},
	{
		id: 7,
		src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Artist performing on stage',
		category: 'performance',
	},
	{
		id: 8,
		src: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
		alt: 'Festival attendees enjoying music',
		category: 'crowd',
	},
]

export function ImageGallery() {
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

	const categories = ['all', 'crowd', 'performance', 'atmosphere']

	const filteredImages =
		selectedCategory === 'all'
			? galleryImages
			: galleryImages.filter((img) => img.category === selectedCategory)

	return (
		<section
			id="gallery"
			className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
		>
			<div className="max-w-7xl mx-auto">
				{/* Enhanced section header */}
				<div className="text-center mb-16">
					<h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
						Festival <span className="text-yellow-400">Highlights</span>
					</h2>
					<p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Relive the magic of Ducky Fest through these incredible moments
						captured at our events
					</p>
				</div>

				{/* Enhanced category filters */}
				<div className="flex flex-wrap justify-center gap-6 mb-16">
					{categories.map((category) => (
						<button
							key={category}
							type="button"
							onClick={() => setSelectedCategory(category)}
							className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
								selectedCategory === category
									? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/25'
									: 'bg-gray-800/70 text-gray-300 hover:bg-yellow-400/20 hover:text-yellow-400 border border-gray-700 hover:border-yellow-400'
							}`}
						>
							{category.charAt(0).toUpperCase() + category.slice(1)}
						</button>
					))}
				</div>

				{/* Enhanced image grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
					{filteredImages.map((image, index) => (
						<button
							type="button"
							key={image.id}
							className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-800 cursor-pointer transform transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-yellow-400/20 hover:z-10"
							onClick={() => setSelectedImage(image)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									setSelectedImage(image)
								}
							}}
							tabIndex={0}
							aria-label={`View ${image.alt} in full size`}
							style={{ animationDelay: `${index * 100}ms` }}
						>
							<img
								src={image.src}
								alt={image.alt}
								className="h-full w-full object-cover transition-all duration-500 group-hover:brightness-125 group-hover:contrast-110"
								loading="lazy"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
								<div className="absolute bottom-6 left-6 right-6">
									<p className="text-white text-lg font-bold mb-2 leading-tight">
										{image.alt}
									</p>
									<span className="inline-block px-4 py-2 bg-yellow-400 text-black text-sm font-black rounded-full">
										{image.category}
									</span>
								</div>
							</div>
							{/* Subtle border glow on hover */}
							<div className="absolute inset-0 rounded-2xl ring-2 ring-yellow-400/0 group-hover:ring-yellow-400/30 transition-all duration-500"></div>
						</button>
					))}
				</div>

				{/* Modal for enlarged image */}
				{selectedImage && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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
						<div className="relative max-w-4xl max-h-[90vh]">
							<img
								src={selectedImage.src}
								alt={selectedImage.alt}
								className="h-auto max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
							/>
							<button
								type="button"
								className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
								onClick={() => setSelectedImage(null)}
								aria-label="Close image preview"
							>
								<svg
									className="h-8 w-8"
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
							<div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4">
								<p className="text-white font-medium">{selectedImage.alt}</p>
								<span className="inline-block mt-2 px-3 py-1 bg-yellow-400 text-black text-sm font-medium rounded">
									{selectedImage.category}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}
