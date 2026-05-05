import { createFileRoute } from '@tanstack/react-router'

import { ConsumerQuiz, sellerConfig } from '@/components/consumer-flow-pages'

export const Route = createFileRoute('/seller/quiz')({
	component: () => <ConsumerQuiz config={sellerConfig} />,
})
