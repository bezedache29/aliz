import { StyleSheet, View, type ViewProps } from 'react-native'

import { radius, spacing } from '@/src/styles/design-tokens'
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
    <View style={[styles.base, { backgroundColor: v.bg }, style]} {...props}>
      <Text variant="label" uppercase style={{ color: v.text }}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
})
