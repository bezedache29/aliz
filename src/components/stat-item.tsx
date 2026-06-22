import { StyleSheet, View, type ViewProps } from 'react-native'

import { spacing } from '@/src/styles/design-tokens'
import { Text } from './text'

type StatSize = 'sm' | 'md' | 'lg'
type StatTrend = 'positive' | 'negative' | 'neutral'

type StatItemProps = ViewProps & {
  label: string
  value: string | number
  unit?: string
  size?: StatSize
  trend?: StatTrend
  align?: 'left' | 'center'
}

const valueVariant = {
  sm: 'heading3',
  md: 'heading1',
  lg: 'display',
} as const

const trendColor = {
  positive: 'accent',
  negative: 'danger',
  neutral: 'primary',
} as const

export function StatItem({
  label,
  value,
  unit,
  size = 'md',
  trend = 'neutral',
  align = 'left',
  style,
  ...props
}: StatItemProps) {
  return (
    <View style={[styles.container, align === 'center' && styles.centered, style]} {...props}>
      <Text variant="caption" color="muted" uppercase>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant={valueVariant[size]} color={trendColor[trend]}>
          {value}
        </Text>
        {unit && (
          <Text variant="caption" color="muted" style={styles.unit}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  centered: {
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  unit: {
    marginBottom: 4,
  },
})
