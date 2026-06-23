import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native'
import tw from 'twrnc'

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

const sizeStyles = {
  sm: tw`py-1 px-2`,
  md: tw`py-3 px-4`,
  lg: tw`py-4 px-6`,
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
        tw`rounded-xl border flex-row items-center justify-center gap-1`,
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
