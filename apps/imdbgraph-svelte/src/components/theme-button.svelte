<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { theme } from '#/lib/store'
	
	let currentTheme: 'light' | 'dark' = 'light'
	
	function toggleTheme() {
		currentTheme = currentTheme === 'light' ? 'dark' : 'light'
		theme.set(currentTheme)
		
		// Update document class
		if (currentTheme === 'dark') {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
		
		// Save to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('theme', currentTheme)
		}
	}
	
	onMount(() => {
		// Initialize theme from localStorage or system preference
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			currentTheme = savedTheme as 'light' | 'dark'
		} else {
			currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
		}
		
		// Apply theme
		if (currentTheme === 'dark') {
			document.documentElement.classList.add('dark')
		}
		
		// Watch for theme changes
		const handleThemeChange = () => {
			const isDark = document.documentElement.classList.contains('dark')
			currentTheme = isDark ? 'dark' : 'light'
		}
		
		// Listen for class changes on document element
		const observer = new MutationObserver(handleThemeChange)
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		})
		
		// Cleanup observer on component destruction
		onDestroy(() => {
			observer.disconnect()
		})
	})
</script>

<button
	type="button"
	class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-input bg-background ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
	on:click={toggleTheme}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
	>
		<title>Light mode</title>
		<circle cx="12" cy="12" r="5" />
		<line x1="12" y1="1" x2="12" y2="3" />
		<line x1="12" y1="21" x2="12" y2="23" />
		<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
		<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
		<line x1="1" y1="12" x2="3" y2="12" />
		<line x1="21" y1="12" x2="23" y2="12" />
		<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
		<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
	</svg>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
	>
		<title>Dark mode</title>
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
	</svg>
	<span class="sr-only">Toggle theme</span>
</button>
