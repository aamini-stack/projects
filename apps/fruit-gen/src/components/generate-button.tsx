import { Button } from '@aamini/ui-neobrutalist/components/button'
import { Shuffle, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function GenerateButton() {
	const [isGenerating, setIsGenerating] = useState(false)

	const triggerGeneration = () => {
		setIsGenerating(true)
		// Reset generating state after animation completes
		setTimeout(() => {
			;(setIsGenerating(false), 800)
		})
	}

	return (
		<Button
			onClick={triggerGeneration}
			disabled={isGenerating}
			size="lg"
			className="border-6 gap-4 bg-orange-300 px-12 py-6 text-2xl font-bold"
		>
			{isGenerating ? (
				<>
					<Sparkles size={32} className="animate-spin text-black" />
					<span>Generate</span>
				</>
			) : (
				<>
					<Shuffle
						size={32}
						className="text-black transition-transform group-hover:rotate-180"
					/>
					<span>Generate</span>
				</>
			)}
		</Button>
	)
}
