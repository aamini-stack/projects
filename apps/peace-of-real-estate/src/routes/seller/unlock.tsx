import { createFileRoute } from '@tanstack/react-router'

import { ConsumerUnlock, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/unlock')({
	component: () => <ConsumerUnlock config={sellerConfig} />,
})
