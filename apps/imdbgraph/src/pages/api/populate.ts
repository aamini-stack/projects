import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
	// This is where your cron job logic would go.
	// For example, fetching data and populating your database.
	console.log('Cron job /api/populate executed!')

	return new Response(JSON.stringify({ message: 'Cron job executed successfully!' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	})
}
