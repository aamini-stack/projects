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
			accentClassName="bg-blue-cyan"
			accentTextClassName="text-blue-cyan"
			accentTintClassName="bg-blue-cyan-tint"
			accentHoverBorderClassName="hover:border-blue-cyan/30"
			questions={buyerQuestionFlow.questions}
			completeTo="/consumer/results"
			completeLabel="View Your Matches"
		/>
	)
}
