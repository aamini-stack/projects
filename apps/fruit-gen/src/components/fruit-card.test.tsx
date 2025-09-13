import type { Fruit } from '@/lib/fruit'
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
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

test('title', () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	expect(screen.getByText('🍎')).toBeVisible()
	expect(screen.getByText('Apple')).toBeVisible()
})

test('description', () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	expect(
		screen.getByText('A crisp, sweet fruit that grows on trees.'),
	).toBeVisible()
})

test('benefits', () => {
	const screen = render(<FruitCard fruit={mockFruit} />)
	expect(screen.getByText('Rich in fiber')).toBeVisible()
	expect(screen.getByText('Good for heart health')).toBeVisible()
})

test('nutrition facts', () => {
	const screen = render(<FruitCard fruit={mockFruit} showDetails={true} />)
	expect(screen.getByText('Nutrition Facts (per 100g)')).toBeVisible()
	expect(screen.getByText('Calories:')).toBeVisible()
	expect(screen.getByText('52')).toBeVisible()
})
