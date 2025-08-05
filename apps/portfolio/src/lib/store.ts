import { atom } from 'nanostores'

export const theme = atom<'theme-light' | 'dark' | 'system' | null>(null)
