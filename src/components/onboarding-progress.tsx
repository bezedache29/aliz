import { View } from 'react-native'
import tw from 'twrnc'

import { useColors } from '@/src/hooks/use-colors'
import { Text } from './text'

interface Props {
  current: number
  total?: number
}

export function OnboardingProgress({ current, total = 6 }: Props) {
  const c = useColors()

  return (
    <View style={tw`gap-1`}>
      <View style={tw`flex-row gap-1`}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              tw`flex-1 h-1 rounded-full`,
              { backgroundColor: i < current ? c.primary : c.border },
            ]}
          />
        ))}
      </View>

      <Text variant="caption" color="muted">
        Étape {current} sur {total}
      </Text>
    </View>
  )
}
