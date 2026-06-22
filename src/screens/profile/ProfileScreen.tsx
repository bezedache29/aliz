import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, View } from 'react-native'

import { useColors } from '@/src/hooks/use-colors'

export default function ProfileScreen() {
  const c = useColors()

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: c.textPrimary }}>Profil</Text>
      </View>
    </SafeAreaView>
  )
}
