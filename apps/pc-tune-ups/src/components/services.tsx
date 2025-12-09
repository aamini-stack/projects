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
import AppleIcon from '/public/apple.svg'

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
					<Laptop2 className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Apple Device Repair"
					description="Certified support for Mac, iPhone, and iPad. We handle memory upgrades, water damage repair, battery swaps, logic-board diagnostics, and more—with 30-day workmanship assurance."
				>
					<img
						src={AppleIcon.src}
						alt="Apple Icon"
						className="h-8 w-8 flex-shrink-0 object-contain"
					/>
				</ServiceCard>
				<ServiceCard
					title="Data Backup & Recovery"
					description="On-site and in-shop recovery for hard drives, flash storage, and memory cards, plus proactive backup planning so you never lose critical files again."
				>
					<Database className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Networking & On-Site Support"
					description="Secure wireless setup, router troubleshooting, small-business networking, and scheduled maintenance visits—delivered at your office or home."
				>
					<Globe className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Virus & Spyware Removal"
					description="Deep malware cleaning, registry repair, security audits, and prevention strategies that keep downtime to a minimum."
				>
					<Shield className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Hardware Upgrades"
					description="Affordable RAM, SSD, GPU, and component upgrades that extend the life of existing systems without the cost of full replacement."
				>
					<Settings className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Custom-Built Computers"
					description="Consultation, sourcing, and assembly for purpose-built rigs—gaming systems, creative workstations, and business-ready desktops that fit your exact specs."
				>
					<Monitor className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
				<ServiceCard
					title="Control4 Home Automation"
					description="Installation, configuration, and ongoing support for Control4 smart-home systems across the New Orleans metro area. Let your home work for you."
				>
					<Home className="h-8 w-8 flex-shrink-0 text-lime-600" />
				</ServiceCard>
			</div>
		</section>
	)
}
