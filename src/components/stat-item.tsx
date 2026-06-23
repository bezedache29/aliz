import { View, type ViewProps } from 'react-native'
import tw from 'twrnc'

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
    <View style={[tw`gap-1`, align === 'center' && tw`items-center`, style]} {...props}>
      <Text variant="caption" color="muted" uppercase>
        {label}
      </Text>
      <View style={tw`flex-row items-end gap-1`}>
        <Text variant={valueVariant[size]} color={trendColor[trend]}>
          {value}
        </Text>
        {unit && (
          <Text variant="caption" color="muted" style={tw`mb-1`}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  )
}
