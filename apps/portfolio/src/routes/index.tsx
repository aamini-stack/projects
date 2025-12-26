import { ContactCard } from '@/components/contact-me'
import GitHub from '@/components/icons/github.svg'
import Linkedin from '@/components/icons/linkedin.svg'
import Pdf from '@/components/icons/pdf.svg'
import { JobBubble } from '@/components/job-bubble'
import { Section } from '@/components/section'
import { SkillBubble } from '@/components/skill-bubble'
import { jobs } from '@/lib/jobs'
import { skills } from '@/lib/skills'
import { Button } from '@aamini/ui/components/button'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown } from 'lucide-react'

export const Route = createFileRoute('/')({
	component: Index,
})

function Index() {
	return (
		<>
			{/* Navigation Header */}
			<header className="bg-background sticky top-0 z-10 mb-1 flex h-(--header-size) w-full items-end px-4">
				<div className="box-shadow font-heading border-border bg-secondary-background flex h-fit flex-1 items-center justify-end gap-4 rounded-lg border-2 px-6 py-2">
					<Button asChild={true} size="icon" variant="neutral">
						<a href="https://github.com/aamini11">
							<GitHub />
						</a>
					</Button>
					<Button asChild={true} size="icon" variant="neutral">
						<a href="https://linkedin.com/in/aria-amini">
							<Linkedin />
						</a>
					</Button>
				</div>
			</header>

			<main>
				{/* Hero/Intro */}
				<header
					id="intro"
					className="flex min-h-[calc(100vh-var(--header-size))] items-center justify-center p-6"
				>
					<hgroup className="flex max-w-lg flex-col items-start">
						<h1 className="flex flex-col items-start gap-2">
							<span className="text-center"> Hello, my name is... </span>
							<b className="text-7xl">Aria Amini</b>
						</h1>
						<p className="text-foreground/40 mt-4 inline">
							I&apos;m a Full-Stack Software Engineer with{' '}
							<b className="text-foreground/60">7 Years of Professional</b>{' '}
							experience building web applications.
						</p>
						<div className="mt-6 flex items-center justify-center gap-4">
							<Button
								onClick={() =>
									document.getElementById('experience')?.scrollIntoView()
								}
								size="lg"
								variant="default"
								className="px-4"
							>
								About Me <ArrowDown className="inline animate-bounce" />
							</Button>
							<Button
								size="lg"
								variant="default"
								className="px-4"
								asChild={true}
							>
								<a href="/Aria_Amini_Resume.pdf" download={true}>
									<Pdf />
									Resume (.pdf)
								</a>
							</Button>
						</div>
					</hgroup>
				</header>

				{/* Experience */}
				<Section
					title="Experience"
					id="experience"
					className="scroll-mt-[calc(var(--header-size)-2px)]"
				>
					<ul className="flex flex-col items-center justify-center gap-8">
						{jobs.map((job) => (
							<li key={job.company}>
								<JobBubble job={job} />
							</li>
						))}
					</ul>
				</Section>

				{/* Skills */}
				<Section title="Skills">
					<ul className="flex flex-wrap justify-center gap-8">
						{skills.map((tech) => (
							<SkillBubble key={tech.name} tech={tech} />
						))}
					</ul>
				</Section>

				{/* Contact */}
				<Section title="Contact Me">
					<ContactCard />
				</Section>
			</main>
		</>
	)
}
