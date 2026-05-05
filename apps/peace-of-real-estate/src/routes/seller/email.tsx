import { createFileRoute } from '@tanstack/react-router'

import { ConsumerEmail, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/email')({
	component: () => <ConsumerEmail config={sellerConfig} />,
})
