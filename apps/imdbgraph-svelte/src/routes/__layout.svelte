<script lang="ts">
	import '../styles/globals.css'
	import { onMount } from 'svelte'
	import { PUBLIC_POSTHOG_KEY } from '$env/static/public'

	// Initialize theme
	onMount(() => {
		const getThemePreference = () => {
			if (
				typeof localStorage !== 'undefined' &&
				localStorage.getItem('theme')
			) {
				return localStorage.getItem('theme')
			}
			return window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
		}
		
		const isDark = getThemePreference() === 'dark'
		document.documentElement.classList[isDark ? 'add' : 'remove']('dark')
		
		if (typeof localStorage !== 'undefined') {
			const observer = new MutationObserver(() => {
				const isDark = document.documentElement.classList.contains('dark')
				localStorage.setItem('theme', isDark ? 'dark' : 'light')
			})
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['class'],
			})
		}
		
		// Initialize posthog
		if (PUBLIC_POSTHOG_KEY) {
			import('posthog-js').then((posthog) => {
				posthog.default.init(PUBLIC_POSTHOG_KEY, {
					api_host: '/api/analytics',
					ui_host: 'https://us.posthog.com',
					defaults: '2025-05-24',
					person_profiles: 'always',
				})
			})
		}
	})
</script>

<div class="flex min-h-dvh flex-col">
	<!-- Header with theme button in top right corner -->
	<div class="ml-auto p-3">
		<slot />
	</div>
	
	<!-- Main content -->
	<div class="flex w-full flex-1 flex-col">
		<slot name="main" />
	</div>
	
	<!-- Footer -->
	<footer class="w-full px-6 py-6">
		<div class="flex flex-col items-center justify-between gap-4">
			<p class="text-muted-foreground text-balance text-center text-sm leading-loose">
				Built by{' '}
				<a
					href="https://www.linkedin.com/in/aria-amini/"
					target="_blank"
					rel="noreferrer"
					class="font-medium underline underline-offset-4"
				>
					Aria
				</a>
				. The source code is available on{' '}
				<a
					href="https://github.com/aamini11/imdbgraph"
					target="_blank"
					rel="noreferrer"
					class="font-medium underline underline-offset-4"
				>
					GitHub
				</a>
				.
			</p>
		</div>
	</footer>
</div>
