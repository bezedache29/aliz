import { atomWithMMKV } from './atomWithMMKV'

export type ThemePreference = 'light' | 'dark' | 'system'

export const themeAtom = atomWithMMKV<ThemePreference>('ui:theme', 'system')
