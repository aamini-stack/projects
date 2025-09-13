import { fruits, type DailyFruit } from '@/lib/fruit'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

type WeeklyPlan = DailyFruit[][]

const hardcodedWeeklyPlan: WeeklyPlan = [
	// Monday
	[
		{ fruit: fruits[0]!, portion: 1.5 }, // Apple
		{ fruit: fruits[1]!, portion: 1 }, // Banana
	],
	// Tuesday
	[
		{ fruit: fruits[2]!, portion: 2 }, // Orange
		{ fruit: fruits[3]!, portion: 0.5 }, // Strawberry
		{ fruit: fruits[15]!, portion: 1 }, // Lemon
	],
	// Wednesday
	[
		{ fruit: fruits[4]!, portion: 1 }, // Grape
		{ fruit: fruits[5]!, portion: 1.5 }, // Pineapple
	],
	// Thursday
	[
		{ fruit: fruits[6]!, portion: 2 }, // Watermelon
		{ fruit: fruits[7]!, portion: 1 }, // Mango
		{ fruit: fruits[16]!, portion: 0.5 }, // Lime
	],
	// Friday
	[
		{ fruit: fruits[8]!, portion: 1 }, // Kiwi
		{ fruit: fruits[9]!, portion: 1.5 }, // Blueberry
	],
	// Saturday
	[
		{ fruit: fruits[10]!, portion: 1 }, // Peach
		{ fruit: fruits[11]!, portion: 2 }, // Cherry
		{ fruit: fruits[17]!, portion: 1 }, // Coconut
	],
	// Sunday
	[
		{ fruit: fruits[12]!, portion: 0.5 }, // Avocado
		{ fruit: fruits[13]!, portion: 1 }, // Pomegranate
		{ fruit: fruits[14]!, portion: 1.5 }, // Papaya
	],
]

export function FruitCalendar() {
	const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(hardcodedWeeklyPlan)
	const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
	const [isGenerating, setIsGenerating] = useState(false)

	const daysOfWeek = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday',
	]

	const generateNewWeek = () => {
		setIsGenerating(true)
		setTimeout(() => {
			setWeeklyPlan(hardcodedWeeklyPlan)
			setCompletedDays(new Set())
			setIsGenerating(false)
		}, 500)
	}

	const toggleDayComplete = (dayIndex: number) => {
		const newCompleted = new Set(completedDays)
		if (newCompleted.has(dayIndex)) {
			newCompleted.delete(dayIndex)
		} else {
			newCompleted.add(dayIndex)
		}
		setCompletedDays(newCompleted)
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{/* Header */}
			<div className="mb-8 text-center">
				<button
					onClick={generateNewWeek}
					disabled={isGenerating}
					className="inline-flex transform items-center gap-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-70"
				>
					<RefreshCw size={20} className={isGenerating ? 'animate-spin' : ''} />
					{isGenerating ? 'Generating...' : 'Generate New Week'}
				</button>
			</div>

			{/* Weekly Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{weeklyPlan.map((dailyFruits, dayIndex) => (
					<div
						key={dayIndex}
						className="relative rounded-xl bg-white shadow-lg"
					>
						{/* Day Header */}
						<div className="mb-4">
							<div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-white shadow-md">
								<div>
									<h3 className="text-lg font-bold">{daysOfWeek[dayIndex]}</h3>
									<p className="text-sm opacity-90">Day {dayIndex + 1}</p>
								</div>
								<button
									onClick={() => {
										toggleDayComplete(dayIndex)
									}}
									className={`rounded-full p-2 transition-all duration-300 ${
										completedDays.has(dayIndex)
											? 'bg-green-500 text-white'
											: 'bg-white/20 text-white hover:bg-white/30'
									}`}
								>
									<CheckCircle2 size={24} />
								</button>
							</div>
						</div>

						{/* Fruit Cards for the day */}
						<div className="space-y-4 p-4">
							{dailyFruits.map((dailyFruit, fruitIndex) => (
								<div
									key={`${dailyFruit.fruit.id}-${dayIndex}-${fruitIndex}`}
									className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-300 ${
										completedDays.has(dayIndex)
											? 'border-green-300 bg-green-50 opacity-75'
											: 'border-gray-200 bg-gray-50'
									}`}
								>
									<span className="text-3xl">{dailyFruit.fruit.emoji}</span>
									<div>
										<p className="font-semibold text-gray-800">
											{dailyFruit.fruit.name}
										</p>
										<p className="text-sm text-gray-600">
											Portion: {dailyFruit.portion} serving
											{dailyFruit.portion !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
							))}
						</div>

						{completedDays.has(dayIndex) && (
							<div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
								<div className="rounded-full bg-green-500 px-4 py-2 font-bold text-white shadow-lg">
									✓ Completed!
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Completion Celebration */}
			{completedDays.size === 7 && (
				<div className="mt-12 rounded-2xl border-4 border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 p-8 text-center">
					<div className="mb-4 text-6xl">🎉</div>
					<h3 className="mb-4 text-3xl font-bold text-green-800">
						Congratulations!
					</h3>
					<p className="mb-6 text-xl text-green-700">
						You've completed your weekly fruit challenge! Your body is thanking
						you for all those nutrients.
					</p>
					<button
						onClick={generateNewWeek}
						className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
					>
						Start New Week Challenge
					</button>
				</div>
			)}
		</div>
	)
}
