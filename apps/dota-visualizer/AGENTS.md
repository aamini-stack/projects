# Dota 2 Visualizer

A web application for visualizing Dota 2 hero statistics and data.

## App Architecture

The app uses a **view registry pattern** for easy extensibility. Each
visualization is a self-contained "view" that receives hero data and renders its
own UI.

### Key Files

- `src/components/views/types.ts` - View type definitions
- `src/components/views/registry.ts` - View registry with all available views
- `src/components/app-header.tsx` - Header with view selector dropdown
- `src/routes/index.tsx` - Main route that handles view switching via `?view=`
  query param

### URL Pattern

Views are selected via query parameter: `/?view=hero-stats`,
`/?view=armor-table`

## How to Add a New View

1. Create a new view component in `src/components/views/<view-name>/index.tsx`:

```typescript
import type { ViewProps } from '../types'

export default function MyNewView({ heroDictionary }: ViewProps) {
  // Your view implementation
  return <div>...</div>
}
```

2. Register the view in `src/components/views/registry.ts`:

```typescript
import MyNewView from './my-new-view'

export const views: ViewDefinition[] = [
	// ... existing views
	{
		id: 'my-new-view',
		name: 'My New View',
		description: 'Description shown in dropdown',
		component: MyNewView,
	},
]
```

3. Done - the view automatically appears in the header dropdown.

## Data Flow

1. Hero data is fetched once in the route loader (`fetchLatestHeroData`)
2. The `heroDictionary` (Map<HeroName, Hero>) is passed to the current view
3. Views can use utilities from `@/lib/dota/` for analysis (e.g.,
   `HeroStatsAnalyzer`)
