import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = PressableProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string
  loading?: boolean
  fullWidth?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  iconOnly?: boolean
}

const sizeStyles = {
  sm: tw`py-1 px-2`,
  md: tw`py-3 px-4`,
  lg: tw`py-4 px-6`,
}

const iconOnlySizeStyles = {
  sm: tw`p-1.5`,
  md: tw`p-2.5`,
  lg: tw`p-3.5`,
}

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  fullWidth = false,
  icon,
  iconOnly = false,
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
    warning: { bg: c.warning, text: '#FFFFFF', border: 'transparent' },
  }

  const v = variantStyles[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityLabel={label}
      disabled={isDisabled}
      style={({ pressed }) => [
        tw`border flex-row items-center justify-center gap-1`,
        iconOnly ? tw`rounded-full` : tw`rounded-xl`,
        iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size],
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: pressed || isDisabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={iconSizes[size]} color={v.text} />}
          {!iconOnly && (
            <Text variant="body" style={{ color: v.text, fontWeight: '600' }}>
              {label}
            </Text>
          )}
        </>
      )}
    </Pressable>
  )
}
