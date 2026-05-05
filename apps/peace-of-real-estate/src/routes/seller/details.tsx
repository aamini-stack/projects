import { createFileRoute } from '@tanstack/react-router'

import { ConsumerDetails, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/details')({
	component: () => <ConsumerDetails config={sellerConfig} />,
})
