import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement = HTMLDivElement>(
	opts: IntersectionObserverInit = {},
) {
	const ref = useRef<T>(null)
	const [isInView, setIsInView] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsInView(true)
					observer.unobserve(el)
				}
			},
			{ threshold: 0.1, ...opts },
		)

		observer.observe(el)
		return () => observer.disconnect()
	}, [opts])

	return { ref, isInView }
}
