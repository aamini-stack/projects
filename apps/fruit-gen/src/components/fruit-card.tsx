import type { Fruit } from '@/lib/fruit'
import { Info } from 'lucide-react'

export function FruitCard({
	fruit,
	showDetails = false,
}: {
	fruit: Fruit
	showDetails?: boolean
}) {
	return (
		<div className="transform overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
			{/* Header */}
			<div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
				<div className="mb-3 text-center text-6xl">{fruit.emoji}</div>
				<h3 className="mb-2 text-center text-2xl font-bold">{fruit.name}</h3>
				<div className="flex items-center justify-center gap-4 text-sm opacity-90">
					<span className="rounded-full bg-white/20 px-3 py-1">
						{fruit.season}
					</span>
					<span className="rounded-full bg-white/20 px-3 py-1">
						{fruit.taste}
					</span>
				</div>
			</div>

			{/* Content */}
			<div className="p-6">
				<p className="mb-4 leading-relaxed text-gray-600">
					{fruit.description}
				</p>

				{/* Benefits */}
				<div className="mb-4">
					<h4 className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
						<Info size={16} className="text-emerald-500" />
						Health Benefits
					</h4>
					<div className="grid grid-cols-2 gap-2">
						{fruit.benefits.map((benefit, index) => (
							<div
								key={index}
								className="rounded-full bg-emerald-50 px-3 py-1 text-center text-sm text-emerald-700"
							>
								{benefit}
							</div>
						))}
					</div>
				</div>

				{showDetails && (
					<div className="rounded-xl bg-gray-50 p-4">
						<h4 className="mb-3 font-semibold text-gray-800">
							Nutrition Facts (per 100g)
						</h4>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Calories:</span>
								<span className="font-medium">
									{fruit.nutritionFacts.calories}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Vitamin C:</span>
								<span className="font-medium">
									{fruit.nutritionFacts.vitaminC}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Fiber:</span>
								<span className="font-medium">
									{fruit.nutritionFacts.fiber}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Potassium:</span>
								<span className="font-medium">
									{fruit.nutritionFacts.potassium}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
