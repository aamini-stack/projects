export function getColorFromString(str: string): string {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash)
	}

	// We want bright, vibrant colors for the neobrutalist look
	const colors = [
		'#A3E635', // Lime
		'#60A5FA', // Blue
		'#F87171', // Red
		'#FBBF24', // Amber
		'#C084FC', // Purple
		'#2DD4BF', // Teal
		'#FB7185', // Rose
		'#818CF8', // Indigo
	]

	return colors[Math.abs(hash) % colors.length] ?? '#A3E635'
}

export function formatDistanceToNow(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date
	const now = new Date()
	const diff = now.getTime() - d.getTime()
	const seconds = Math.floor(diff / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (seconds < 60) return `${seconds}s ago`
	if (minutes < 60) return `${minutes}m ago`
	if (hours < 24) return `${hours}h ago`
	return `${days}d ago`
}
