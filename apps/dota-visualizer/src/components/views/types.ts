import type { HeroDictionary } from '@/lib/dota/hero'
import type { ComponentType } from 'react'

export interface ViewProps {
	heroDictionary: HeroDictionary
}

export interface ViewDefinition {
	id: string
	name: string
	description: string
	component: ComponentType<ViewProps>
}
