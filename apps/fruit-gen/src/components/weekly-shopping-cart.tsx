import { ShoppingCart } from 'lucide-react'

export function WeeklyShoppingCart() {
	return (
		<div id="weekly-shopping-cart" className="mx-auto max-w-4xl p-6">
			<div className="border-4 border-black bg-blue-100 p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="mx-auto mb-6 h-24 w-24 rounded-full border-4 border-black bg-white p-4">
					<ShoppingCart size={40} className="mx-auto text-gray-400" />
				</div>
				<h2 className="mb-2 text-2xl font-bold text-black">
					Ready to discover new fruits?
				</h2>
				<p className="text-gray-700">
					Click "Generate List" to create your personalized weekly fruit
					shopping list!
				</p>
			</div>
		</div>
	)
}
