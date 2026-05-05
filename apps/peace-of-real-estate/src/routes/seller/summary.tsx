import { createFileRoute } from '@tanstack/react-router'

import { ConsumerSummary, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/summary')({
	component: () => <ConsumerSummary config={sellerConfig} />,
})
