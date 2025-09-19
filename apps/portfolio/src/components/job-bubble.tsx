import { Button } from '@aamini/ui/components/button'
import { Card } from '@aamini/ui/components/card'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@radix-ui/react-collapsible'
import { ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import type { JobInfo } from '#/lib/jobs'

export function JobBubble({ job }: { job: JobInfo }) {
	const header = job.bulletPoints[0]
	const bulletPoints = job.bulletPoints.slice(1)
	const [isOpen, setIsOpen] = useState(false)

	return (
		<Card className="min-w-sm max-w-lg px-8 pt-6">
			{/* Header */}
			<header className="flex">
				<div className="flex h-10 w-10 items-center justify-center">
					<img
						src={job.imageSrc}
						alt={`${job.company} logo`}
						height={40}
						width={40}
					/>
				</div>
				<hgroup className="ml-2 mr-12 flex flex-1 flex-col">
					<h2>{job.company}</h2>
					<p className="text-sm">{job.role}</p>
				</hgroup>
				<time className="text-end text-sm">
					{job.timeRange[0]} - {job.timeRange[1]}
				</time>
			</header>

			<span className="mt-4 text-sm">{header}</span>
			{/* Bullet Points */}
			<Collapsible
				open={isOpen}
				onOpenChange={setIsOpen}
				className="flex flex-col items-center"
			>
				<CollapsibleContent className="animate-collapsible">
					<ul className="list-inside list-disc space-y-2 border-t pt-6 text-sm">
						{bulletPoints.map((bulletPoint) => (
							<li key={bulletPoint}>{bulletPoint}</li>
						))}
					</ul>
				</CollapsibleContent>
				<CollapsibleTrigger className="my-2" asChild={true}>
					<Button variant="neutral" size="icon" className="w-fit gap-0.5 px-4">
						{isOpen ? 'See Less' : 'See More'}
						<ChevronsUpDown />
					</Button>
				</CollapsibleTrigger>
			</Collapsible>
		</Card>
	)
}
