export interface Fruit {
	id: string
	name: string
	emoji: string
	season: string
	color: string
	taste: string
	benefits: string[]
	description: string
	nutritionFacts: {
		calories: number
		vitaminC: string
		fiber: string
		potassium: string
	}
}

export interface DailyFruit {
	fruit: Fruit
	portion: number
}

export const fruits: Fruit[] = [
	{
		id: 'apple',
		name: 'Apple',
		emoji: '🍎',
		season: 'Fall',
		color: 'Red/Green',
		taste: 'Sweet & Crisp',
		benefits: ['Rich in fiber', 'Antioxidants', 'Heart healthy', 'Low calorie'],
		description:
			"A classic fruit that's perfect for snacking. Apples are crunchy, refreshing, and come in many varieties.",
		nutritionFacts: {
			calories: 52,
			vitaminC: '14% DV',
			fiber: '2.4g',
			potassium: '107mg',
		},
	},
	{
		id: 'banana',
		name: 'Banana',
		emoji: '🍌',
		season: 'Year-round',
		color: 'Yellow',
		taste: 'Sweet & Creamy',
		benefits: [
			'High in potassium',
			'Natural energy',
			'Digestive health',
			'Mood boosting',
		],
		description:
			"Nature's energy bar! Bananas are perfect for quick energy and are packed with essential nutrients.",
		nutritionFacts: {
			calories: 89,
			vitaminC: '15% DV',
			fiber: '2.6g',
			potassium: '358mg',
		},
	},
	{
		id: 'orange',
		name: 'Orange',
		emoji: '🍊',
		season: 'Winter',
		color: 'Orange',
		taste: 'Citrusy & Juicy',
		benefits: [
			'Vitamin C powerhouse',
			'Immune support',
			'Hydrating',
			'Anti-inflammatory',
		],
		description:
			'Bursting with vitamin C and refreshing citrus flavor. Perfect for boosting your immune system.',
		nutritionFacts: {
			calories: 47,
			vitaminC: '92% DV',
			fiber: '2.4g',
			potassium: '237mg',
		},
	},
	{
		id: 'strawberry',
		name: 'Strawberry',
		emoji: '🍓',
		season: 'Spring/Summer',
		color: 'Red',
		taste: 'Sweet & Tart',
		benefits: ['Antioxidant rich', 'Heart healthy', 'Anti-aging', 'Low sugar'],
		description:
			'Sweet, juicy berries that are as nutritious as they are delicious. Great for desserts or snacking.',
		nutritionFacts: {
			calories: 32,
			vitaminC: '149% DV',
			fiber: '2.0g',
			potassium: '153mg',
		},
	},
	{
		id: 'grape',
		name: 'Grapes',
		emoji: '🍇',
		season: 'Summer/Fall',
		color: 'Purple/Green',
		taste: 'Sweet & Juicy',
		benefits: ['Resveratrol', 'Heart health', 'Brain function', 'Hydrating'],
		description:
			'Small but mighty! Grapes are packed with antioxidants and make the perfect bite-sized snack.',
		nutritionFacts: {
			calories: 62,
			vitaminC: '6% DV',
			fiber: '0.8g',
			potassium: '191mg',
		},
	},
	{
		id: 'pineapple',
		name: 'Pineapple',
		emoji: '🍍',
		season: 'Year-round',
		color: 'Yellow',
		taste: 'Sweet & Tangy',
		benefits: [
			'Digestive enzymes',
			'Anti-inflammatory',
			'Immune support',
			'Manganese',
		],
		description:
			'Tropical and sweet with a tangy kick. Contains bromelain enzyme that aids digestion.',
		nutritionFacts: {
			calories: 50,
			vitaminC: '131% DV',
			fiber: '1.4g',
			potassium: '109mg',
		},
	},
	{
		id: 'watermelon',
		name: 'Watermelon',
		emoji: '🍉',
		season: 'Summer',
		color: 'Green/Red',
		taste: 'Sweet & Refreshing',
		benefits: ['Hydrating', 'Lycopene', 'Low calorie', 'Electrolytes'],
		description:
			'The ultimate summer fruit! Watermelon is incredibly hydrating and refreshingly sweet.',
		nutritionFacts: {
			calories: 30,
			vitaminC: '21% DV',
			fiber: '0.4g',
			potassium: '112mg',
		},
	},
	{
		id: 'mango',
		name: 'Mango',
		emoji: '🥭',
		season: 'Summer',
		color: 'Orange/Yellow',
		taste: 'Sweet & Tropical',
		benefits: [
			'Vitamin A',
			'Digestive health',
			'Skin health',
			'Immune support',
		],
		description:
			'The king of fruits! Mangoes are incredibly sweet and packed with vitamins and minerals.',
		nutritionFacts: {
			calories: 60,
			vitaminC: '100% DV',
			fiber: '1.6g',
			potassium: '168mg',
		},
	},
	{
		id: 'kiwi',
		name: 'Kiwi',
		emoji: '🥝',
		season: 'Year-round',
		color: 'Brown/Green',
		taste: 'Sweet & Tart',
		benefits: ['Vitamin C', 'Digestive enzymes', 'Fiber rich', 'Folate'],
		description:
			'Small but mighty! Kiwis pack more vitamin C than oranges and have a unique sweet-tart flavor.',
		nutritionFacts: {
			calories: 61,
			vitaminC: '185% DV',
			fiber: '3.0g',
			potassium: '237mg',
		},
	},
	{
		id: 'blueberry',
		name: 'Blueberries',
		emoji: '🫐',
		season: 'Summer',
		color: 'Blue/Purple',
		taste: 'Sweet & Mild',
		benefits: [
			'Antioxidant superfood',
			'Brain health',
			'Memory boost',
			'Anti-aging',
		],
		description:
			'Tiny superfoods! Blueberries are one of the most antioxidant-rich fruits available.',
		nutritionFacts: {
			calories: 57,
			vitaminC: '16% DV',
			fiber: '2.4g',
			potassium: '77mg',
		},
	},
	{
		id: 'peach',
		name: 'Peach',
		emoji: '🍑',
		season: 'Summer',
		color: 'Orange/Pink',
		taste: 'Sweet & Juicy',
		benefits: ['Vitamin A', 'Skin health', 'Eye health', 'Potassium'],
		description:
			'Fuzzy and sweet with a beautiful fragrance. Peaches are perfect for summer and great for skin health.',
		nutritionFacts: {
			calories: 39,
			vitaminC: '11% DV',
			fiber: '1.5g',
			potassium: '190mg',
		},
	},
	{
		id: 'cherry',
		name: 'Cherries',
		emoji: '🍒',
		season: 'Summer',
		color: 'Red',
		taste: 'Sweet & Tart',
		benefits: ['Melatonin', 'Anti-inflammatory', 'Sleep aid', 'Recovery'],
		description:
			'Small red gems that are naturally sweet and may help improve sleep quality.',
		nutritionFacts: {
			calories: 50,
			vitaminC: '18% DV',
			fiber: '1.6g',
			potassium: '173mg',
		},
	},
	{
		id: 'avocado',
		name: 'Avocado',
		emoji: '🥑',
		season: 'Year-round',
		color: 'Green',
		taste: 'Creamy & Mild',
		benefits: ['Healthy fats', 'Heart health', 'Nutrient absorption', 'Fiber'],
		description:
			'Technically a fruit! Avocados are creamy, nutritious, and perfect for both sweet and savory dishes.',
		nutritionFacts: {
			calories: 160,
			vitaminC: '17% DV',
			fiber: '6.7g',
			potassium: '485mg',
		},
	},
	{
		id: 'pomegranate',
		name: 'Pomegranate',
		emoji: '🫘',
		season: 'Fall/Winter',
		color: 'Red',
		taste: 'Sweet & Tart',
		benefits: [
			'Antioxidant rich',
			'Heart health',
			'Anti-inflammatory',
			'Brain health',
		],
		description:
			'Ancient superfruit packed with ruby-red seeds that burst with flavor and nutrients.',
		nutritionFacts: {
			calories: 83,
			vitaminC: '30% DV',
			fiber: '4.0g',
			potassium: '236mg',
		},
	},
	{
		id: 'papaya',
		name: 'Papaya',
		emoji: '🫒',
		season: 'Year-round',
		color: 'Orange',
		taste: 'Sweet & Tropical',
		benefits: [
			'Digestive enzymes',
			'Vitamin C',
			'Anti-inflammatory',
			'Skin health',
		],
		description:
			'Tropical fruit with a sweet, musky flavor. Contains papain enzyme that aids digestion.',
		nutritionFacts: {
			calories: 43,
			vitaminC: '200% DV',
			fiber: '1.7g',
			potassium: '182mg',
		},
	},
	{
		id: 'lemon',
		name: 'Lemon',
		emoji: '🍋',
		season: 'Year-round',
		color: 'Yellow',
		taste: 'Sour & Tangy',
		benefits: [
			'High in Vitamin C',
			'Detoxifying',
			'Aids digestion',
			'Immune support',
		],
		description:
			'Zesty and refreshing, lemons are great for flavoring and health.',
		nutritionFacts: {
			calories: 29,
			vitaminC: '88% DV',
			fiber: '2.8g',
			potassium: '138mg',
		},
	},
	{
		id: 'lime',
		name: 'Lime',
		emoji: '🟢',
		season: 'Year-round',
		color: 'Green',
		taste: 'Sour & Aromatic',
		benefits: [
			'Rich in Vitamin C',
			'Antioxidants',
			'Skin health',
			'Aids digestion',
		],
		description: 'Similar to lemon, limes offer a distinct tartness and aroma.',
		nutritionFacts: {
			calories: 30,
			vitaminC: '48% DV',
			fiber: '2.8g',
			potassium: '102mg',
		},
	},
	{
		id: 'coconut',
		name: 'Coconut',
		emoji: '🥥',
		season: 'Year-round',
		color: 'Brown',
		taste: 'Sweet & Nutty',
		benefits: ['Electrolytes', 'Healthy fats', 'Hydrating', 'Energy boost'],
		description:
			'A versatile tropical fruit, great for hydration and healthy fats.',
		nutritionFacts: {
			calories: 354,
			vitaminC: '4% DV',
			fiber: '9g',
			potassium: '356mg',
		},
	},
	{
		id: 'fig',
		name: 'Fig',
		emoji: ' अंजीर',
		season: 'Summer/Fall',
		color: 'Purple/Green',
		taste: 'Sweet & Chewy',
		benefits: ['High in fiber', 'Minerals', 'Bone health', 'Antioxidants'],
		description:
			'Sweet and unique, figs are a delightful treat with many health benefits.',
		nutritionFacts: {
			calories: 74,
			vitaminC: '2% DV',
			fiber: '2.9g',
			potassium: '232mg',
		},
	},
	{
		id: 'date',
		name: 'Date',
		emoji: ' dates',
		season: 'Fall',
		color: 'Brown',
		taste: 'Very Sweet & Chewy',
		benefits: [
			'Natural sweetener',
			'High in fiber',
			'Potassium',
			'Energy boost',
		],
		description:
			'Dates are a naturally sweet fruit, perfect for energy and a healthy snack.',
		nutritionFacts: {
			calories: 282,
			vitaminC: '0% DV',
			fiber: '6.7g',
			potassium: '696mg',
		},
	},
]
