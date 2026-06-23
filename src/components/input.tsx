import { forwardRef } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

type InputProps = TextInputProps & {
  label?: string
  error?: string
  unit?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, unit, style, ...props },
  ref,
) {
  const c = useColors()

  return (
    <View style={tw`gap-1`}>
      {label && (
        <Text variant="label" color="secondary" uppercase>
          {label}
        </Text>
      )}
      <View
        style={[
          tw`flex-row items-center rounded-xl px-4`,
          {
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: error ? c.danger : c.border,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={c.textMuted}
          style={[tw`flex-1 py-4 text-base`, { color: c.textPrimary }, style]}
          {...props}
        />
        {unit && (
          <Text variant="body" color="muted">
            {unit}
          </Text>
        )}
      </View>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  )
})
