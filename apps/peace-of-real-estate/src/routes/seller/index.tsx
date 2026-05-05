import { createFileRoute } from '@tanstack/react-router'

import { ConsumerIndex, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/')({
	component: () => <ConsumerIndex config={sellerConfig} />,
})
