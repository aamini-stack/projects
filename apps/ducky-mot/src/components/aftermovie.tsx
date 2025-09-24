export function Aftermovie() {
	return (
		<section
			id="duckyfest2023-aftermovie"
			className="py-16 px-4 sm:px-6 lg:px-8"
		>
			<div className="max-w-6xl mx-auto">
				<h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
					ducky.fest 2023 | Aftermovie
				</h2>
				<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-12">
					<iframe
						className="w-full h-full"
						src="https://www.youtube.com/embed/krrw6ylZecQ"
						title="ducky.fest 2023 | Official Aftermovie"
						frameBorder={0}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
					/>
				</div>

				<h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
					ducky.ROOM 2023 | Aftermovie
				</h2>
				<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
					<iframe
						className="w-full h-full"
						src="https://www.youtube.com/embed/7WxpKu7bFm8"
						title="Ducky.Room After-Movie (Part 1)"
						frameBorder={0}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
					/>
				</div>
			</div>
		</section>
	)
}
