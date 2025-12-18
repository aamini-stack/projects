export function Divider() {
	return (
		<div className="relative">
			<div className="absolute inset-0 flex items-center" aria-hidden="true">
				<div className="w-full border-t border-stone-200" />
			</div>
			<div className="relative flex justify-center">
				<span className="h-2 w-16 rounded-full bg-gradient-to-r from-lime-400/70 via-lime-500 to-lime-600" />
			</div>
		</div>
	)
}
