import { StyleSheet, View, type ViewProps } from 'react-native'

import { radius, spacing } from '@/src/styles/design-tokens'
import { useColors } from '@/src/hooks/use-colors'

type CardProps = ViewProps & {
  elevated?: boolean
  noPadding?: boolean
}

export function Card({
  elevated = false,
  noPadding = false,
  style,
  children,
  ...props
}: CardProps) {
  const c = useColors()

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? c.surfaceElevated : c.surface,
          borderColor: c.border,
        },
        !noPadding && styles.padded,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  padded: {
    padding: spacing.md,
  },
})
