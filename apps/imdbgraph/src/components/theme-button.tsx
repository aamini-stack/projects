import { theme } from '#/lib/store'
import { Button } from '@aamini/ui/components/button'
import { useStore } from '@nanostores/react'
import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

export function ThemeButton() {
	const $theme = useStore(theme)

	useEffect(() => {
		const isDarkMode = document.documentElement.classList.contains('dark')
		theme.set(isDarkMode ? 'dark' : 'theme-light')
	}, [])

	useEffect(() => {
		if ($theme !== null) {
			const isDark =
				$theme === 'dark' ||
				($theme === 'system' &&
					window.matchMedia('(prefers-color-scheme: dark)').matches)
			document.documentElement.classList[isDark ? 'add' : 'remove']('dark')
		}
	}, [$theme])

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => {
				theme.set($theme === 'theme-light' ? 'dark' : 'theme-light')
			}}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
