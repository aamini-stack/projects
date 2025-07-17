import { ContactCard } from '@/components/contact-me';
import { JobBubble } from '@/components/job-bubble';
import { Button } from '@/components/primitives/button';
import { SkillBubble } from '@/components/skill-bubble';
import { ThemeButton } from '@/components/theme-button';
import { jobs } from '@/lib/jobs';
import { skills } from '@/lib/skills';
import { cn } from '@/lib/utils';
import { ArrowDown, Linkedin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Index() {
  return (
    <>
      {/* Navigation Header */}
      <header
        role="banner"
        className="bg-background h-(--header-size) sticky top-0 z-10 mb-1 flex w-full items-end px-4"
      >
        <div className="box-shadow font-heading border-border bg-secondary-background flex h-fit flex-1 items-center justify-end gap-4 rounded-lg border-2 px-6 py-2">
          <Button size="icon" variant="neutral" asChild>
            <Link href="https://github.com/aamini11">
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 496 512"
              >
                <path
                  className="fill-foreground"
                  d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                />
              </svg>
            </Link>
          </Button>

          <Button size="icon" variant="neutral" asChild>
            <Link href="https://linkedin.com/in/aria-amini">
              <Linkedin />
            </Link>
          </Button>

          <ThemeButton />
        </div>
      </header>

      <main>
        {/* Hero/Intro */}
        <header
          id="intro"
          className="flex min-h-[calc(100vh_-_var(--header-size))] items-center justify-center p-6"
        >
          <hgroup className="flex max-w-lg flex-col items-start">
            <h1 className="flex flex-col items-start gap-2">
              <span className="text-center font-mono">
                Hello, my name is...
              </span>
              <b className="text-7xl">Aria Amini</b>
            </h1>
            <p className="text-foreground/40 mt-4 inline">
              I&apos;m a Full-Stack Software Engineer with{' '}
              <b className="text-foreground/60">7 Years of Professional</b>{' '}
              experience building web applications.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button asChild size="lg" variant="default" className="px-4">
                <a href={'#experience'}>
                  About Me <ArrowDown className="animate-bounce" />
                </a>
              </Button>
              <Button asChild size="lg" variant="default" className="px-4">
                <Link download={true} href="/Aria_Amini_Resume.pdf">
                  <Image
                    src="/icons/pdf.svg"
                    alt="PDF Icon"
                    width={20}
                    height={20}
                  />
                  Resume (.pdf)
                </Link>
              </Button>
            </div>
          </hgroup>
        </header>

        {/* Experience */}
        <Section
          title="Experience"
          id="experience"
          className="scroll-mt-[calc(var(--header-size)_-_2px)]" // account for border with -4px
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
  );
}

/** https://getpublii.com/blog/one-line-css-solution-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header.html */
const Section = ({ className, ...props }: React.ComponentProps<'section'>) => {
  return (
    <section className={cn('border-t-2 px-6 py-16', className)} {...props}>
      <h2 className="pb-12 text-center text-5xl font-bold">{props.title}</h2>
      <div className="flex items-center justify-center">{props.children}</div>
    </section>
  );
};
