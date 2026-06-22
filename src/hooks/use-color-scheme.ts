import { useAtomValue } from 'jotai'
import { useColorScheme as useSystemColorScheme } from 'react-native'

import { themeAtom } from '@/src/store/themeAtom'

export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme() ?? 'dark'
  const preference = useAtomValue(themeAtom)
  return preference === 'system' ? system : preference
}
