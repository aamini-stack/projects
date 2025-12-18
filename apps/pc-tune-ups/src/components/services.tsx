import {
	Database,
	Globe,
	Home,
	Laptop2,
	Monitor,
	Settings,
	Shield,
} from 'lucide-react'
import type { ReactNode } from 'react'

interface ServiceCardProps {
	title: string
	description: string
	children: ReactNode
}

function ServiceCard({ title, description, children }: ServiceCardProps) {
	return (
		<article className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
			<div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-lime-200/40 blur-3xl" />
			<div className="relative space-y-3">
				<div className="flex items-start justify-between gap-4">
					<h3 className="text-2xl font-semibold text-stone-900">{title}</h3>
					{children}
				</div>
				<p className="text-base leading-relaxed text-stone-600 sm:text-lg">
					{description}
				</p>
			</div>
		</article>
	)
}

export default function Services() {
	return (
		<section className="space-y-8">
			<div className="space-y-3 text-center">
				<h2 className="text-4xl font-bold tracking-tight text-stone-900">
					Services
				</h2>
			</div>
			<div className="grid gap-6 sm:grid-cols-2">
				<ServiceCard
					title="Computer & Laptop Repair"
					description="Trusted diagnostic and repair work for any desktop or laptop brand—hardware replacement, OS reinstalls, cracked hinges or panels, LCD repairs, and complete tune-ups that keep machines running at peak performance."
				>
					<Laptop2 className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Apple Device Repair"
					description="Certified support for Mac, iPhone, and iPad. We handle memory upgrades, water damage repair, battery swaps, logic-board diagnostics, and more—with 30-day workmanship assurance."
				>
					<AppleIcon />
				</ServiceCard>
				<ServiceCard
					title="Data Backup & Recovery"
					description="On-site and in-shop recovery for hard drives, flash storage, and memory cards, plus proactive backup planning so you never lose critical files again."
				>
					<Database className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Networking & On-Site Support"
					description="Secure wireless setup, router troubleshooting, small-business networking, and scheduled maintenance visits—delivered at your office or home."
				>
					<Globe className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Virus & Spyware Removal"
					description="Deep malware cleaning, registry repair, security audits, and prevention strategies that keep downtime to a minimum."
				>
					<Shield className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Hardware Upgrades"
					description="Affordable RAM, SSD, GPU, and component upgrades that extend the life of existing systems without the cost of full replacement."
				>
					<Settings className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Custom-Built Computers"
					description="Consultation, sourcing, and assembly for purpose-built rigs—gaming systems, creative workstations, and business-ready desktops that fit your exact specs."
				>
					<Monitor className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Control4 Home Automation"
					description="Installation, configuration, and ongoing support for Control4 smart-home systems across the New Orleans metro area. Let your home work for you."
				>
					<Home className="h-8 w-8 shrink-0 text-lime-600" />
				</ServiceCard>
			</div>
		</section>
	)
}

function AppleIcon() {
	return (
		<svg
			className="h-8 w-8"
			xmlns="http://www.w3.org/2000/svg"
			width="814"
			height="1000"
			viewBox="0 0 814 1000"
		>
			<path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
		</svg>
	)
}
