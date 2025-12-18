import { Aftermovie } from '#/components/aftermovie'
import { BusinessInquiries } from '#/components/business-inquiries'
import { Events } from '#/components/events'
import { Footer } from '#/components/footer'
import { Header } from '#/components/header'
import { Hero } from '#/components/hero'
import { OurMission } from '#/components/our-mission'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Index,
})

function Index() {
	return (
		<>
			{/* Enhanced dark background with multiple layers */}
			<div className="fixed inset-0 -z-10 bg-linear-to-br from-gray-900 via-black to-gray-800" />
			<div className="fixed inset-0 -z-10 bg-linear-to-t from-black/20 via-transparent to-black/40" />

			{/* Main container */}
			<div className="flex min-h-screen flex-col">
				{/* Header */}
				<Header />

				<main id="content">
					{/* Hero Section */}
					<Hero />

					{/* Ducky Events */}
					<Events />

					{/* Aftermovie */}
					<Aftermovie />

					{/* Our Mission */}
					<OurMission />

					{/* Business Inquiries */}
					<BusinessInquiries />
				</main>

				{/* Footer */}
				<Footer />
			</div>
		</>
	)
}
