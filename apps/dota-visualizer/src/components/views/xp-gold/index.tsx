import stats from '@/lib/dota/stats.json'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@aamini/ui/components/chart'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import type { ViewProps } from '../types'

// Dota 2 XP requirements per level (cumulative XP to reach each level)
const XP_TABLE = [
	{ level: 1, xpToLevel: 0, totalXp: 0 },
	{ level: 2, xpToLevel: 240, totalXp: 240 },
	{ level: 3, xpToLevel: 360, totalXp: 600 },
	{ level: 4, xpToLevel: 480, totalXp: 1080 },
	{ level: 5, xpToLevel: 600, totalXp: 1680 },
	{ level: 6, xpToLevel: 720, totalXp: 2400 },
	{ level: 7, xpToLevel: 750, totalXp: 3150 },
	{ level: 8, xpToLevel: 890, totalXp: 4040 },
	{ level: 9, xpToLevel: 1030, totalXp: 5070 },
	{ level: 10, xpToLevel: 1200, totalXp: 6270 },
	{ level: 11, xpToLevel: 1400, totalXp: 7670 },
	{ level: 12, xpToLevel: 1600, totalXp: 9270 },
	{ level: 13, xpToLevel: 1850, totalXp: 11120 },
	{ level: 14, xpToLevel: 2100, totalXp: 13220 },
	{ level: 15, xpToLevel: 2350, totalXp: 15570 },
	{ level: 16, xpToLevel: 2600, totalXp: 18170 },
	{ level: 17, xpToLevel: 2850, totalXp: 21020 },
	{ level: 18, xpToLevel: 3100, totalXp: 24120 },
	{ level: 19, xpToLevel: 3500, totalXp: 27620 },
	{ level: 20, xpToLevel: 3900, totalXp: 31520 },
	{ level: 21, xpToLevel: 4300, totalXp: 35820 },
	{ level: 22, xpToLevel: 4700, totalXp: 40520 },
	{ level: 23, xpToLevel: 5100, totalXp: 45620 },
	{ level: 24, xpToLevel: 5500, totalXp: 51120 },
	{ level: 25, xpToLevel: 5900, totalXp: 57020 },
	{ level: 26, xpToLevel: 6300, totalXp: 63320 },
	{ level: 27, xpToLevel: 6700, totalXp: 70020 },
	{ level: 28, xpToLevel: 7100, totalXp: 77120 },
	{ level: 29, xpToLevel: 7500, totalXp: 84620 },
	{ level: 30, xpToLevel: 7900, totalXp: 92520 },
]

const chartConfig = {
	totalXp: {
		label: 'Total XP',
		color: 'hsl(45, 93%, 47%)',
	},
} satisfies ChartConfig

// Get all neutral creeps flattened and sorted by gold
function getAllNeutralsSortedByGold() {
	const neutrals: Array<{
		name: string
		goldMin: number
		goldMax: number
		tier: string
	}> = []

	const camps = stats.neutralCreeps.camps
	for (const [tierKey, camp] of Object.entries(camps)) {
		for (const creep of camp.creeps) {
			neutrals.push({
				name: creep.name,
				goldMin: creep.goldMin,
				goldMax: creep.goldMax,
				tier: tierKey,
			})
		}
	}

	return neutrals.sort((a, b) => b.goldMax - a.goldMax)
}

const TIER_LABELS: Record<string, string> = {
	small: 'Small',
	medium: 'Medium',
	large: 'Large',
	ancient: 'Ancient',
}

export default function XpGoldView(_props: ViewProps) {
	const neutrals = getAllNeutralsSortedByGold()
	const { melee, ranged, siege, flagbearer } = stats.laneCreeps

	return (
		<div className="w-full max-w-4xl space-y-16 pb-16">
			{/* Hero Levels Section */}
			<section className="animate-in fade-in duration-700">
				<h2 className="mb-2 font-serif text-3xl font-bold tracking-tight text-amber-600">
					Hero Levels
				</h2>
				<p className="mb-8 text-zinc-400">
					XP required to reach each level, from 1 to 30.
				</p>

				{/* XP Chart */}
				<div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
					<ChartContainer config={chartConfig} className="h-72 w-full">
						<AreaChart data={XP_TABLE} margin={{ left: 12, right: 12 }}>
							<defs>
								<linearGradient id="xpGradient" x1="0" y1="0" x2="1" y2="0">
									<stop offset="0%" stopColor="hsl(240, 60%, 50%)" />
									<stop offset="50%" stopColor="hsl(280, 60%, 50%)" />
									<stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
								</linearGradient>
								<linearGradient id="xpFillGradient" x1="0" y1="0" x2="1" y2="0">
									<stop
										offset="0%"
										stopColor="hsl(240, 60%, 50%)"
										stopOpacity={0.3}
									/>
									<stop
										offset="50%"
										stopColor="hsl(280, 60%, 50%)"
										stopOpacity={0.3}
									/>
									<stop
										offset="100%"
										stopColor="hsl(45, 93%, 47%)"
										stopOpacity={0.3}
									/>
								</linearGradient>
							</defs>
							<XAxis
								dataKey="level"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tick={{ fill: '#18181b', fontSize: 12 }}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tick={{ fill: '#18181b', fontSize: 12 }}
								tickFormatter={(value: number) =>
									value >= 1000
										? `${(value / 1000).toFixed(0)}k`
										: String(value)
								}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										formatter={(value, _name) => (
											<div className="flex items-center gap-2">
												<span className="text-zinc-400">Total XP:</span>
												<span className="font-mono font-bold text-amber-400">
													{Number(value).toLocaleString()}
												</span>
											</div>
										)}
										labelFormatter={(label) => `Level ${label}`}
									/>
								}
							/>
							<Area
								type="monotone"
								dataKey="totalXp"
								stroke="url(#xpGradient)"
								strokeWidth={3}
								fill="url(#xpFillGradient)"
							/>
						</AreaChart>
					</ChartContainer>
				</div>

				{/* XP Table */}
				<div className="overflow-hidden rounded-lg border border-zinc-300">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-300 bg-zinc-100">
								<th className="px-4 py-3 text-left font-semibold text-zinc-700">
									Level
								</th>
								<th className="px-4 py-3 text-right font-semibold text-zinc-700">
									XP to Level
								</th>
								<th className="px-4 py-3 text-right font-semibold text-amber-600">
									Total XP
								</th>
							</tr>
						</thead>
						<tbody>
							{XP_TABLE.map((row) => (
								<tr key={row.level} className="border-b border-zinc-200">
									<td className="px-4 py-2 font-mono text-zinc-900">
										{row.level}
									</td>
									<td className="px-4 py-2 text-right font-mono text-zinc-700">
										{row.xpToLevel > 0
											? `+${row.xpToLevel.toLocaleString()}`
											: '—'}
									</td>
									<td className="px-4 py-2 text-right font-mono font-medium text-amber-600">
										{row.totalXp.toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* Creep Scaling Formulas Section */}
			<section className="animate-in fade-in delay-150 duration-700">
				<h2 className="mb-2 font-serif text-3xl font-bold tracking-tight text-amber-600">
					Creep Scaling
				</h2>
				<p className="mb-8 text-zinc-400">
					Lane creeps upgrade every 7.5 minutes (max 30 stacks).
				</p>

				<div className="grid gap-4 sm:grid-cols-2">
					{/* Melee Creep */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
						<h3 className="mb-3 text-lg font-semibold text-zinc-100">
							{melee.name}
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-600">Base Gold</span>
								<span className="font-mono text-emerald-600">
									{melee.base.goldMin}–{melee.base.goldMax}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-600">Base XP</span>
								<span className="font-mono text-amber-600">
									{melee.base.xp}
								</span>
							</div>
							<div className="mt-4 rounded bg-zinc-800/60 p-3 font-mono text-xs">
								<div className="text-emerald-600">
									Gold = {melee.base.goldMin}–{melee.base.goldMax} + (stacks ×{' '}
									{melee.scaling?.goldPerInterval ?? 0})
								</div>
							</div>
						</div>
					</div>

					{/* Ranged Creep */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
						<h3 className="mb-3 text-lg font-semibold text-zinc-100">
							{ranged.name}
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-600">Base Gold</span>
								<span className="font-mono text-emerald-600">
									{ranged.base.goldMin}–{ranged.base.goldMax}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-600">Base XP</span>
								<span className="font-mono text-amber-600">
									{ranged.base.xp}
								</span>
							</div>
							<div className="mt-4 rounded bg-zinc-800/60 p-3 font-mono text-xs">
								<div className="text-emerald-600">
									Gold = {ranged.base.goldMin}–{ranged.base.goldMax} + (stacks ×{' '}
									{ranged.scaling?.goldPerInterval ?? 0})
								</div>
								<div className="mt-1 text-amber-600">
									XP = {ranged.base.xp} + (stacks ×{' '}
									{ranged.scaling?.xpPerInterval ?? 0})
								</div>
							</div>
						</div>
					</div>

					{/* Siege Creep */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
						<h3 className="mb-3 text-lg font-semibold text-zinc-100">
							{siege.name}
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-600">Base Gold</span>
								<span className="font-mono text-emerald-600">
									{siege.base.goldMin}–{siege.base.goldMax}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-600">Base XP</span>
								<span className="font-mono text-amber-600">
									{siege.base.xp}
								</span>
							</div>
							<div className="mt-4 rounded bg-zinc-800/60 p-3 font-mono text-xs text-zinc-500">
								Does not scale
							</div>
						</div>
					</div>

					{/* Flagbearer Creep */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
						<h3 className="mb-3 text-lg font-semibold text-zinc-100">
							{flagbearer.name}
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-zinc-600">Base Gold</span>
								<span className="font-mono text-emerald-600">
									{flagbearer.base.goldMin}–{flagbearer.base.goldMax}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-zinc-600">Base XP</span>
								<span className="font-mono text-amber-600">
									{flagbearer.base.xp}
								</span>
							</div>
							<div className="mt-4 rounded bg-zinc-800/60 p-3 font-mono text-xs text-zinc-500">
								Does not scale
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Neutral Gold Section */}
			<section className="animate-in fade-in delay-300 duration-700">
				<h2 className="mb-2 font-serif text-3xl font-bold tracking-tight text-amber-600">
					Neutral Creep Gold
				</h2>
				<p className="mb-8 text-zinc-400">
					All neutral creeps sorted by gold bounty (highest to lowest).
				</p>

				<div className="overflow-hidden rounded-lg border border-zinc-300">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-300 bg-zinc-100">
								<th className="px-4 py-3 text-left font-semibold text-zinc-700">
									Creep
								</th>
								<th className="px-4 py-3 text-left font-semibold text-zinc-700">
									Tier
								</th>
								<th className="px-4 py-3 text-right font-semibold text-emerald-600">
									Gold
								</th>
							</tr>
						</thead>
						<tbody>
							{neutrals.map((creep) => (
								<tr key={creep.name} className="border-b border-zinc-200">
									<td className="px-4 py-2 text-zinc-900">{creep.name}</td>
									<td className="px-4 py-2 text-zinc-600">
										{TIER_LABELS[creep.tier] ?? creep.tier}
									</td>
									<td className="px-4 py-2 text-right font-mono font-medium text-emerald-600">
										{creep.goldMin}–{creep.goldMax}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}
