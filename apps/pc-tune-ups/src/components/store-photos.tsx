'use client'

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@aamini/ui/components/carousel'

const storePhotos = [
	{
		src: '/pc1.webp',
		alt: 'PC Tune-Ups store interior - workstation area',
	},
	{
		src: '/pc2.webp',
		alt: 'PC Tune-Ups store interior - service counter',
	},
	{
		src: '/pc3.webp',
		alt: 'PC Tune-Ups store interior - repair area',
	},
]

export function StorePhotos() {
	return (
		<div className="w-full">
			<Carousel
				opts={{
					align: 'start',
					loop: true,
				}}
				className="w-full"
			>
				<CarouselContent>
					{storePhotos.map((photo, index) => (
						<CarouselItem key={index}>
							<div className="overflow-hidden rounded-2xl border border-white/10">
								<img
									src={photo.src}
									alt={photo.alt}
									className="h-auto w-full object-cover"
									loading={index === 0 ? 'eager' : 'lazy'}
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="left-4 bg-black/50 text-white hover:bg-black/70 hover:text-emerald-200 border-white/20" />
				<CarouselNext className="right-4 bg-black/50 text-white hover:bg-black/70 hover:text-emerald-200 border-white/20" />
			</Carousel>
		</div>
	)
}
