import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks } from 'lucide-react'
import { useState } from 'react'

import { FlowPageShell } from '@/components/flow-page-shell'
import type { CoreQuestion } from '@/lib/questions'

type AnswerValue = number | number[] | string

type QuestionFlowProps = {
	backTo: string
	backLabel: string
	stepLabel: string
	accentClassName: string
	accentTextClassName: string
	accentTintClassName: string
	accentHoverBorderClassName: string
	questions: CoreQuestion[]
	completeTo: string
	completeLabel: string
}

export function QuestionFlow({
	backTo,
	backLabel,
	stepLabel,
	accentClassName,
	accentTextClassName,
	accentTintClassName,
	accentHoverBorderClassName,
	questions,
	completeTo,
	completeLabel,
}: QuestionFlowProps) {
	const [currentQuestion, setCurrentQuestion] = useState(0)
	const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})

	const question = questions[currentQuestion]!
	const progress = ((currentQuestion + 1) / questions.length) * 100
	const answer = answers[question.id]

	const isMultipleChoice = question.selection?.type === 'multiple'
	const isOpenText = question.inputType === 'open-text'

	const canProceed = (() => {
		if (isOpenText) {
			return typeof answer === 'string' && answer.trim().length > 0
		}

		if (isMultipleChoice) {
			return Array.isArray(answer) && answer.length > 0
		}

		return typeof answer === 'number'
	})()

	const handleNext = () => {
		if (currentQuestion < questions.length - 1) {
			setCurrentQuestion((prev) => prev + 1)
		}
	}

	const handleBack = () => {
		if (currentQuestion > 0) {
			setCurrentQuestion((prev) => prev - 1)
		}
	}

	const toggleOption = (optionIndex: number) => {
		if (!isMultipleChoice) {
			setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
			return
		}

		const existing = Array.isArray(answer) ? answer : []
		const isSelected = existing.includes(optionIndex)

		if (isSelected) {
			setAnswers((prev) => ({
				...prev,
				[question.id]: existing.filter((value) => value !== optionIndex),
			}))
			return
		}

		const next = [...existing, optionIndex].slice(
			-(question.selection?.maxSelections ?? 1),
		)

		setAnswers((prev) => ({ ...prev, [question.id]: next }))
	}

	const isComplete = currentQuestion === questions.length - 1 && canProceed

	return (
		<FlowPageShell
			backTo={backTo}
			backLabel={backLabel}
			title="Core Questions"
			subtitle={stepLabel}
			icon={ListChecks}
			iconClassName={`${accentTintClassName} ${accentTextClassName}`}
		>
			<div className="mb-6 w-full">
				<div className="mb-3 flex items-center justify-between text-xs">
					<span className={`${accentTextClassName} data-label`}>
						Question {currentQuestion + 1} of {questions.length}
					</span>
					<span className="data-number text-muted-foreground">
						{Math.round(progress)}%
					</span>
				</div>
				<div className="bg-border h-1 overflow-hidden">
					<div
						className={`${accentClassName} h-full transition-all duration-500`}
						style={{ width: `${progress}%` }}
					/>
				</div>
				<div className="mt-3 flex items-center justify-between">
					<button
						type="button"
						onClick={handleBack}
						disabled={currentQuestion === 0}
						className="text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50"
					>
						<ArrowLeft className="h-4 w-4" />
						Previous
					</button>

					{isComplete ? (
						<Link
							to={completeTo}
							className={`${accentClassName} text-primary-foreground inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-90`}
						>
							{completeLabel}
							<ArrowRight className="h-4 w-4" />
						</Link>
					) : (
						<button
							type="button"
							onClick={handleNext}
							disabled={!canProceed}
							aria-label="Next Question"
							className={`${accentClassName} text-primary-foreground inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50`}
						>
							Next
							<ArrowRight className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			<h2 className="mb-2 font-serif text-xl leading-relaxed font-normal">
				{question.prompt}
			</h2>
			{question.categoryNote ? (
				<p className="text-muted-foreground mb-8 text-sm">
					{question.categoryNote}
				</p>
			) : (
				<div className="mb-8" />
			)}

			{isOpenText ? (
				<textarea
					value={typeof answer === 'string' ? answer : ''}
					onChange={(e) =>
						setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
					}
					placeholder="Share a few details"
					rows={6}
					className="border-border bg-background focus:border-primary w-full border px-4 py-3 text-sm leading-relaxed focus:outline-none"
				/>
			) : (
				<div className="space-y-3">
					{question.options?.map((option, optionIndex) => {
						const isSelected = Array.isArray(answer)
							? answer.includes(optionIndex)
							: answer === optionIndex

						return (
							<button
								key={option}
								type="button"
								onClick={() => toggleOption(optionIndex)}
								className={`flex w-full items-center gap-4 border p-4 text-left transition-all duration-200 ${
									isSelected
										? `border-current ${accentTextClassName} ${accentTintClassName}`
										: `border-border ${accentHoverBorderClassName} hover:bg-secondary`
								}`}
							>
								<div
									className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
										isSelected
											? `border-current ${accentClassName}`
											: 'border-border'
									}`}
								>
									{isSelected ? (
										<CheckCircle2 className="text-primary-foreground h-3.5 w-3.5" />
									) : null}
								</div>
								<span className="text-foreground text-sm leading-relaxed">
									{option}
								</span>
							</button>
						)
					})}
				</div>
			)}
		</FlowPageShell>
	)
}
