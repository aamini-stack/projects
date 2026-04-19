const storePhotos = [
	{
		src: '/photos/pc1.webp',
		alt: 'PC Tune-Ups store interior - workstation area',
	},
	{
		src: '/photos/pc2.webp',
		alt: 'PC Tune-Ups store interior - service counter',
	},
	{
		src: '/photos/pc3.webp',
		alt: 'PC Tune-Ups store interior - repair area',
	},
]

export function StorePhotos() {
	return (
		<div className="grid gap-3 p-3 md:grid-cols-[1.4fr_1fr]">
			<div className="overflow-hidden rounded-2xl border border-white/10">
				<img
					src={storePhotos[0]?.src ?? ''}
					alt={storePhotos[0]?.alt ?? ''}
					className="h-full min-h-72 w-full object-cover"
					loading="eager"
				/>
			</div>
			<div className="grid gap-3">
				{storePhotos.slice(1).map((photo, index) => (
					<div
						key={photo.src}
						className="overflow-hidden rounded-2xl border border-white/10"
					>
						<img
							src={photo.src}
							alt={photo.alt}
							className="h-40 w-full object-cover"
							loading={index === 0 ? 'eager' : 'lazy'}
						/>
					</div>
				))}
			</div>
		</div>
	)
}
