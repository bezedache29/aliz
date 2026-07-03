import dayjs from '@/src/config/dayjs'
import { useSetAtom } from 'jotai'
import { TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { AvatarButton } from '@/src/components/avatar-button'
import { Text } from '@/src/components/text'
import { DayContent } from '@/src/features/planning/DayContent'
import { WeekStrip } from '@/src/features/planning/WeekStrip'
import { useColors } from '@/src/hooks/use-colors'
import { selectedDateAtom } from '@/src/store/planningAtom'

export default function PlanningScreen() {
  const c = useColors()
  const setSelectedDate = useSetAtom(selectedDateAtom)

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[tw`flex-1`, { backgroundColor: c.background }]}
    >
      <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-8`}>
        <Text variant="heading1" style={{ fontWeight: '700' }}>
          Agenda
        </Text>
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity
            onPress={() => setSelectedDate(dayjs())}
            style={[tw`px-2 py-1 rounded-full`, { backgroundColor: c.primary + '18' }]}
            activeOpacity={0.7}
          >
            <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
              {"Aujourd'hui"}
            </Text>
          </TouchableOpacity>
          <AvatarButton />
        </View>
      </View>

      <WeekStrip />
      <DayContent />
    </SafeAreaView>
  )
}
