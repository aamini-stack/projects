import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@aamini/ui/components/select'
import { defaultViewId, views } from './views/registry'

interface AppHeaderProps {
	currentViewId: string
	onViewChange: (viewId: string) => void
}

export function AppHeader({ currentViewId, onViewChange }: AppHeaderProps) {
	return (
		<header className="mb-8 flex w-full max-w-4xl items-center justify-between">
			<h1 className="text-3xl font-bold text-gray-900">Dota 2 Visualizer</h1>
			<Select
				value={currentViewId || defaultViewId}
				onValueChange={onViewChange}
			>
				<SelectTrigger className="w-64">
					<SelectValue placeholder="Select a view" />
				</SelectTrigger>
				<SelectContent>
					{views.map((view) => (
						<SelectItem key={view.id} value={view.id}>
							<div className="flex flex-col items-start">
								<span className="font-medium">{view.name}</span>
								<span className="text-xs text-gray-500">
									{view.description}
								</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</header>
	)
}
