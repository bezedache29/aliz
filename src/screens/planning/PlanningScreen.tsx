import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

export default function PlanningScreen() {
  const c = useColors()

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background, padding: 16 }}
    >
      <Text variant="heading1">Planning</Text>
    </SafeAreaView>
  )
}
