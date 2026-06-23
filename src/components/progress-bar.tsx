import { View, type ViewProps } from 'react-native'
import tw from 'twrnc'

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
      <View style={[tw`flex-row items-center gap-2`, style]} {...props}>
        <Text variant="caption" color="secondary" style={tw`w-18`}>
          {label}
        </Text>
        <View
          style={[
            tw`flex-1 h-1.5 rounded-full overflow-hidden`,
            { backgroundColor: c.surfaceElevated },
          ]}
        >
          <View
            style={[
              tw`h-full rounded-full`,
              { backgroundColor: fill, width: `${progress * 100}%` },
            ]}
          />
        </View>
        {showValues && (
          <Text variant="caption" color="secondary" style={tw`w-16 text-right`}>
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
    <View style={[tw`gap-1`, style]} {...props}>
      <View style={tw`flex-row justify-between items-center`}>
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
      <View
        style={[tw`h-1.5 rounded-full overflow-hidden`, { backgroundColor: c.surfaceElevated }]}
      >
        <View
          style={[tw`h-full rounded-full`, { backgroundColor: fill, width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  )
}
