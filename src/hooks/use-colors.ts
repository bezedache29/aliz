import { colors, type ColorTokens } from '@/src/styles/design-tokens'
import { useColorScheme } from './use-color-scheme'

export function useColors(): ColorTokens {
  return colors[useColorScheme()]
}
