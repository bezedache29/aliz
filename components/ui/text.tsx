import { Text as RNText, type TextProps, type TextStyle } from 'react-native'

import { fontSize, fontWeight, lineHeight } from '@/constants/design-tokens'
import { useColors } from '@/hooks/use-colors'

type TextVariant = 'display' | 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label'
type TextColor = 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'warning'

type TextComponentProps = TextProps & {
  variant?: TextVariant
  color?: TextColor
  uppercase?: boolean
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.extrabold,
    lineHeight: lineHeight.display,
  },
  heading1: {
    fontSize: fontSize.heading1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading1,
  },
  heading2: {
    fontSize: fontSize.heading2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading2,
  },
  heading3: {
    fontSize: fontSize.heading3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading3,
  },
  body: { fontSize: fontSize.body, fontWeight: fontWeight.regular, lineHeight: lineHeight.body },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.caption,
  },
  label: { fontSize: fontSize.label, fontWeight: fontWeight.medium, lineHeight: lineHeight.label },
}

export function Text({
  variant = 'body',
  color = 'primary',
  uppercase = false,
  style,
  ...props
}: TextComponentProps) {
  const c = useColors()

  const colorMap: Record<TextColor, string> = {
    primary: c.textPrimary,
    secondary: c.textSecondary,
    muted: c.textMuted,
    accent: c.primary,
    danger: c.danger,
    warning: c.warning,
  }

  return (
    <RNText
      style={[
        variantStyles[variant],
        { color: colorMap[color] },
        uppercase && { textTransform: 'uppercase', letterSpacing: 0.8 },
        style,
      ]}
      {...props}
    />
  )
}
