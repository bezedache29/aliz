import { StyleSheet, View, type ViewProps } from 'react-native'

import { radius, spacing } from '@/constants/design-tokens'
import { useColors } from '@/hooks/use-colors'
import { Text } from './text'

type ProgressBarProps = ViewProps & {
  label: string
  value: number
  max: number
  unit?: string
  color?: string
  showValues?: boolean
}

export function ProgressBar({
  label,
  value,
  max,
  unit = 'g',
  color,
  showValues = true,
  style,
  ...props
}: ProgressBarProps) {
  const c = useColors()
  const fill = color ?? c.primary
  const progress = Math.min(value / max, 1)

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.header}>
        <Text variant="caption" color="secondary">
          {label}
        </Text>
        {showValues && (
          <Text variant="caption" color="secondary">
            {value}
            <Text variant="caption" color="muted">
              /{max}
              {unit}
            </Text>
          </Text>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: c.surfaceElevated }]}>
        <View style={[styles.fill, { backgroundColor: fill, width: `${progress * 100}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
})
