const stylesPath = 'src/styles.css'

try {
	await import(/* @vite-ignore */ stylesPath)
} catch {
	// No styles.css file, skip
}
