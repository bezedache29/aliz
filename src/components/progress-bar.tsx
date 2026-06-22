import { StyleSheet, View, type ViewProps } from 'react-native'

import { radius, spacing } from '@/src/styles/design-tokens'
import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type ProgressBarProps = ViewProps & {
  label: string
  value: number
  max: number
  unit?: string
  color?: string
  showValues?: boolean
  inline?: boolean
}

export function ProgressBar({
  label,
  value,
  max,
  unit = 'g',
  color,
  showValues = true,
  inline = false,
  style,
  ...props
}: ProgressBarProps) {
  const c = useColors()
  const exceeded = value >= max
  const fill = exceeded ? c.danger : (color ?? c.primary)
  const progress = Math.min(value / max, 1)

  if (inline) {
    return (
      <View style={[styles.inlineContainer, style]} {...props}>
        <Text variant="caption" color="secondary" style={styles.inlineLabel}>
          {label}
        </Text>
        <View style={[styles.track, styles.inlineTrack, { backgroundColor: c.surfaceElevated }]}>
          <View style={[styles.fill, { backgroundColor: fill, width: `${progress * 100}%` }]} />
        </View>
        {showValues && (
          <Text variant="caption" color="secondary" style={styles.inlineValues}>
            {value}
            <Text variant="caption" color="muted">
              /{max}
              {unit}
            </Text>
          </Text>
        )}
      </View>
    )
  }

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
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineLabel: {
    width: 72,
  },
  inlineTrack: {
    flex: 1,
  },
  inlineValues: {
    width: 64,
    textAlign: 'right',
  },
})
