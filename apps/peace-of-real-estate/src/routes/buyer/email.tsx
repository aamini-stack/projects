import { createFileRoute } from '@tanstack/react-router'

import { ConsumerEmail, buyerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/buyer/email')({
	component: () => <ConsumerEmail config={buyerConfig} />,
})
