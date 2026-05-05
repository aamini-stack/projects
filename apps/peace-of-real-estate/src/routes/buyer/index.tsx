import { createFileRoute } from '@tanstack/react-router'

import { ConsumerIndex, buyerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/buyer/')({
	component: () => <ConsumerIndex config={buyerConfig} />,
})
