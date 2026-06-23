import { View, type ViewProps } from 'react-native'
import tw from 'twrnc'

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
        tw`rounded-2xl border`,
        { backgroundColor: elevated ? c.surfaceElevated : c.surface, borderColor: c.border },
        !noPadding && tw`p-4`,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}
