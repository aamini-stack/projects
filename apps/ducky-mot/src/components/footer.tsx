export function Footer() {
	return (
		<footer className="border-t border-gray-800 bg-black">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex items-center gap-6">
					<a
						href="https://instagram.com/ducky.mot?igshid=MzRlODBiNWFlZA=="
						className="font-medium text-gray-300 transition-colors hover:text-yellow-400"
						target="_blank"
						rel="noopener noreferrer"
					>
						Instagram
					</a>
					<a
						href="https://www.youtube.com/@duckymot"
						className="font-medium text-gray-300 transition-colors hover:text-yellow-400"
						target="_blank"
						rel="noopener noreferrer"
					>
						Youtube
					</a>
				</div>
				<div className="mt-4 text-sm text-gray-400">
					Copyright © 2025 DuckyMot
				</div>
			</div>
		</footer>
	)
}
