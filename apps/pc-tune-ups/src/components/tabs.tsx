import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@aamini/ui/components'
import {
	Tabs as TabFramework,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@aamini/ui/components/tabs'

export function Tabs() {
	return (
		<TabFramework defaultValue="all" className="space-y-6">
			<TabsList className="flex flex-wrap gap-2 bg-white/10 p-1">
				{[
					{ id: 'all', label: 'All' },
					{ id: 'apple', label: 'Apple' },
					{ id: 'pc', label: 'PC & Laptop' },
					{ id: 'security', label: 'Data & Security' },
					{ id: 'networking', label: 'Networking' },
				].map(({ id, label }) => (
					<TabsTrigger
						key={id}
						value={id}
						className="rounded-full border border-transparent px-4 py-2 text-sm text-white data-[state=active]:border-white/50 data-[state=active]:bg-white/20"
					>
						{label}
					</TabsTrigger>
				))}
			</TabsList>

			{[
				{
					value: 'all',
					services: [
						{
							title: 'iPhone display & glass',
							turnaround: '2 hours',
							price: 'From $129',
						},
						{
							title: 'MacBook tune-up & clean',
							turnaround: 'Next-day',
							price: 'From $149',
						},
						{
							title: 'Data backup & recovery',
							turnaround: '1-3 days',
							price: 'From $199',
						},
						{
							title: 'Small business onsite support',
							turnaround: 'Same-day dispatch',
							price: 'From $249',
						},
					],
				},
				{
					value: 'apple',
					services: [
						{
							title: 'iPad battery replacement',
							turnaround: 'Same-day',
							price: 'From $119',
						},
						{
							title: 'Apple Watch repair',
							turnaround: '24 hours',
							price: 'From $179',
						},
						{
							title: 'Mac data migration',
							turnaround: '2 days',
							price: 'From $179',
						},
					],
				},
				{
					value: 'pc',
					services: [
						{
							title: 'Custom PC builds',
							turnaround: '3-5 days',
							price: 'From $299',
						},
						{
							title: 'Gaming rig optimization',
							turnaround: 'Next-day',
							price: 'From $179',
						},
						{
							title: 'Laptop motherboard repair',
							turnaround: '3-5 days',
							price: 'From $249',
						},
					],
				},
				{
					value: 'security',
					services: [
						{
							title: 'Emergency data recovery',
							turnaround: 'Same-day',
							price: 'From $299',
						},
						{
							title: 'Virus & malware removal',
							turnaround: '24 hours',
							price: 'From $149',
						},
						{
							title: 'Cybersecurity hardening',
							turnaround: '2-4 days',
							price: 'Custom quote',
						},
					],
				},
				{
					value: 'networking',
					services: [
						{
							title: 'WiFi heatmapping & install',
							turnaround: '2 days',
							price: 'From $249',
						},
						{
							title: 'Office network setup',
							turnaround: '3 days',
							price: 'From $499',
						},
						{
							title: 'Smart home troubleshooting',
							turnaround: '2 days',
							price: 'From $199',
						},
					],
				},
			].map(({ value, services }) => (
				<TabsContent key={value} value={value} className="mt-0">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{services.map(({ title, turnaround, price }) => (
							<Card
								key={title}
								className="border-white/10 bg-white/5 p-6 shadow"
							>
								<CardHeader className="space-y-3 p-0">
									<CardTitle className="text-white">{title}</CardTitle>
									<CardDescription className="text-sm text-white/60">
										Turnaround: {turnaround}
									</CardDescription>
								</CardHeader>
								<CardContent className="flex items-center justify-between p-0 pt-4 text-sm text-white/70">
									<span>{price}</span>
									<a
										className="text-emerald-200 hover:text-emerald-100"
										href="#contact"
									>
										Book now →
									</a>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			))}
		</TabFramework>
	)
}
