import { RefreshControl, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'

export default function TodayScreen() {
  const c = useColors()
  const { refreshing, refresh } = useRefresh()

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        <Text variant="heading1">{"Aujourd'hui"}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
