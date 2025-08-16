import { QueryClient } from '@tanstack/react-query'
import { atom } from 'nanostores'

// React-Query:
export const queryClient = new QueryClient()

// Nanostore atoms:
export const theme = atom<'theme-light' | 'dark' | 'system' | null>(null)
