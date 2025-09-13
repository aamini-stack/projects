import type { Fruit } from '@/lib/fruit'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { FruitCard } from './fruit-card'

const mockFruit: Fruit = {
	id: 'apple',
	name: 'Apple',
	emoji: '🍎',
	season: 'Autumn',
	color: 'Red',
	taste: 'Sweet',
	description: 'A crisp, sweet fruit that grows on trees.',
	benefits: ['Rich in fiber', 'Good for heart health'],
	nutritionFacts: {
		calories: 52,
		vitaminC: '4.6mg',
		fiber: '2.4g',
		potassium: '107mg',
	},
}

test('title', async () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	await expect.element(screen.getByText('🍎')).toBeInTheDocument()
	await expect.element(screen.getByText('Apple')).toBeInTheDocument()
})

test('description', async () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	await expect
		.element(screen.getByText('A crisp, sweet fruit that grows on trees.'))
		.toBeInTheDocument()
})

test('benefits', async () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	await expect.element(screen.getByText('Rich in fiber')).toBeInTheDocument()
	await expect
		.element(screen.getByText('Good for heart health'))
		.toBeInTheDocument()
})

test('nutrition facts', async () => {
	const screen = render(<FruitCard fruit={mockFruit} showDetails={true} />)
	await expect
		.element(screen.getByText('Nutrition Facts (per 100g)'))
		.toBeInTheDocument()
	await expect.element(screen.getByText('Calories:')).toBeInTheDocument()
	await expect.element(screen.getByText('52')).toBeInTheDocument()
})
