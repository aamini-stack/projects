export function Aftermovie() {
	return (
		<section
			id="duckyfest2023-aftermovie"
			className="px-4 py-16 sm:px-6 lg:px-8"
		>
			<div className="mx-auto max-w-6xl">
				<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
					ducky.fest 2023 | Aftermovie
				</h2>
				<div className="relative mb-12 aspect-video w-full overflow-hidden rounded-lg bg-black">
					<iframe
						className="h-full w-full"
						src="https://www.youtube.com/embed/krrw6ylZecQ"
						title="ducky.fest 2023 | Official Aftermovie"
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
					/>
				</div>

				<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
					ducky.ROOM 2023 | Aftermovie
				</h2>
				<div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
					<iframe
						className="h-full w-full"
						src="https://www.youtube.com/embed/7WxpKu7bFm8"
						title="Ducky.Room After-Movie (Part 1)"
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
					/>
				</div>
			</div>
		</section>
	)
}
