import { createFileRoute } from '@tanstack/react-router'

import { QuestionFlow } from '@/components/question-flow'
import { buyerQuestionFlow } from '@/lib/questions'

export const Route = createFileRoute('/consumer/quiz')({
	component: ConsumerQuiz,
})

function ConsumerQuiz() {
	return (
		<QuestionFlow
			backTo="/consumer"
			backLabel="Back to priorities"
			stepLabel="Step 2 of 4 - Help us understand your preferences"
			accentClassName="bg-teal"
			accentTextClassName="text-teal"
			accentTintClassName="bg-teal-tint"
			accentHoverBorderClassName="hover:border-teal/30"
			questions={buyerQuestionFlow.questions}
			completeTo="/consumer/results"
			completeLabel="View Your Matches"
		/>
	)
}
