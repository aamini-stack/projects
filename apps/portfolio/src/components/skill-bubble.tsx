import type { Tech } from '@/lib/skills'

export function SkillBubble({ tech }: { tech: Tech }) {
	return (
		<div
			className="box-shadow relative flex h-28 w-28 flex-col rounded-base border border-border bg-background p-2 text-center"
			key={tech.name}
		>
			{tech.name}
			<div className="flex flex-1 justify-center overflow-hidden">
				<img
					className="h-full w-full object-contain p-2"
					src={tech.src}
					alt={`${tech.name} logo`}
				/>
			</div>
		</div>
	)
}
