import { Text, type TextProps } from 'react-native'
import tw from 'twrnc'

import { useThemeColor } from '@/src/hooks/use-theme-color'

export type ThemedTextProps = TextProps & {
  lightColor?: string
  darkColor?: string
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'
}

const typeStyles = {
  default: tw`text-base leading-6`,
  defaultSemiBold: tw`text-base leading-6 font-semibold`,
  title: tw`text-[32px] font-bold leading-8`,
  subtitle: tw`text-xl font-bold`,
  link: tw`text-base`,
}

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')
  const linkColor = type === 'link' ? '#0a7ea4' : undefined

  return (
    <Text
      style={[
        { color: linkColor ?? color },
        typeStyles[type],
        type === 'link' && { lineHeight: 30 },
        style,
      ]}
      {...rest}
    />
  )
}
