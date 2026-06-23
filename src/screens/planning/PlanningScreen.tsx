import dayjs from '@/src/config/dayjs'
import { useSetAtom } from 'jotai'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { DayContent } from '@/src/features/planning/DayContent'
import { WeekStrip } from '@/src/features/planning/WeekStrip'
import { useColors } from '@/src/hooks/use-colors'
import { selectedDateAtom } from '@/src/store/planningAtom'
import { radius, spacing } from '@/src/styles/design-tokens'

export default function PlanningScreen() {
  const c = useColors()
  const setSelectedDate = useSetAtom(selectedDateAtom)

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text variant="heading1">Agenda</Text>
        <TouchableOpacity
          onPress={() => setSelectedDate(dayjs())}
          style={[styles.todayBadge, { backgroundColor: c.primary + '18' }]}
          activeOpacity={0.7}
        >
          <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
            {"Aujourd'hui"}
          </Text>
        </TouchableOpacity>
      </View>

      <WeekStrip />
      <DayContent />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  todayBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
})
