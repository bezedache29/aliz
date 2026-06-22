import { colors, type ColorTokens } from '@/constants/design-tokens'
import { useColorScheme } from './use-color-scheme'

export function useColors(): ColorTokens {
  return colors[useColorScheme()]
}
