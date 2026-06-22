import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native'

import { radius, spacing } from '@/src/styles/design-tokens'
import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = PressableProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string
  loading?: boolean
  fullWidth?: boolean
}

const sizeStyles: Record<ButtonSize, ViewStyle & { fontSize?: number }> = {
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  md: { paddingVertical: 12, paddingHorizontal: spacing.md },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const c = useColors()

  const variantStyles = {
    primary: { bg: c.primary, text: '#FFFFFF', border: 'transparent' },
    secondary: { bg: c.surface, text: c.textPrimary, border: c.border },
    ghost: { bg: 'transparent', text: c.textPrimary, border: 'transparent' },
    danger: { bg: c.danger, text: '#FFFFFF', border: 'transparent' },
  }

  const v = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: pressed || isDisabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text variant="body" style={{ color: v.text, fontWeight: '600' }}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
})
