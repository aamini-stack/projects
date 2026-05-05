import { createFileRoute } from '@tanstack/react-router'

import { ConsumerResults } from '@/routes/consumer/results'

export const Route = createFileRoute('/seller/results')({
	component: ConsumerResults,
})
