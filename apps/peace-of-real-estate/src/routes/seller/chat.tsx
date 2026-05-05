import { createFileRoute } from '@tanstack/react-router'

import { ConsumerChat, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/chat')({
	component: () => <ConsumerChat config={sellerConfig} />,
})
