import { createFileRoute } from '@tanstack/react-router'

import { ConsumerResults } from '@/routes/consumer/results'

export const Route = createFileRoute('/buyer/results')({
	component: ConsumerResults,
})
