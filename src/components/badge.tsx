import { View, type ViewProps } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'

type BadgeProps = ViewProps & {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'neutral', style, ...props }: BadgeProps) {
  const c = useColors()

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: `${c.primary}20`, text: c.primary },
    warning: { bg: `${c.warning}20`, text: c.warning },
    danger: { bg: `${c.danger}20`, text: c.danger },
    neutral: { bg: c.surfaceElevated, text: c.textSecondary },
  }

  const v = variantMap[variant]

  return (
    <View
      style={[tw`rounded-full py-1 px-2 self-center`, { backgroundColor: v.bg }, style]}
      {...props}
    >
      <Text variant="label" uppercase style={{ color: v.text }}>
        {label}
      </Text>
    </View>
  )
}
