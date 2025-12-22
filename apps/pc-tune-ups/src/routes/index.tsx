import { Divider } from '@/components/divider'
import Footer from '@/components/footer.tsx'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import Services from '@/components/services'
import { Testimonials } from '@/components/testimonials'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Index,
})

function Index() {
	return (
		<>
			<Header />
			<main className="mx-auto flex max-w-5xl flex-col gap-16 p-6 sm:p-10 lg:p-16">
				<Hero />
				<Divider />
				<Services />
				<Divider />
				<Testimonials />
			</main>
			<Footer />
		</>
	)
}
