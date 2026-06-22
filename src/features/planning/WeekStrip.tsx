import Ionicons from '@expo/vector-icons/Ionicons'
import dayjs from '@/src/config/dayjs'
import { Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { selectedDateAtom } from '@/src/store/planningAtom'
import { spacing } from '@/src/styles/design-tokens'

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export function WeekStrip() {
  const c = useColors()
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom)

  const startOfWeek = selectedDate.startOf('isoWeek')
  const today = dayjs()

  const days: Dayjs[] = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))

  const weekLabel = `${startOfWeek.format('D')} – ${startOfWeek.add(6, 'day').format('D MMMM YYYY')}`

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      {/* Navigation semaine */}
      <View style={styles.nav}>
        <TouchableOpacity
          testID="prev-week"
          onPress={() => setSelectedDate(selectedDate.subtract(1, 'week'))}
          hitSlop={12}
          style={[styles.navButton, { backgroundColor: c.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={16} color={c.textSecondary} />
        </TouchableOpacity>

        <Text variant="label" color="secondary" uppercase style={{ letterSpacing: 0.5 }}>
          {weekLabel}
        </Text>

        <TouchableOpacity
          testID="next-week"
          onPress={() => setSelectedDate(selectedDate.add(1, 'week'))}
          hitSlop={12}
          style={[styles.navButton, { backgroundColor: c.surfaceElevated }]}
        >
          <Ionicons name="chevron-forward" size={16} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Jours */}
      <View style={styles.daysRow}>
        {days.map((day, index) => {
          const isSelected = day.isSame(selectedDate, 'day')
          const isToday = day.isSame(today, 'day')

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayColumn}
              onPress={() => setSelectedDate(day)}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                style={{
                  color: isSelected ? c.primary : c.textSecondary,
                  fontWeight: isSelected ? '700' : '400',
                }}
              >
                {DAY_LABELS[index]}
              </Text>

              <View style={[styles.dayCircle, isSelected && { backgroundColor: c.primary }]}>
                <Text
                  variant="body"
                  style={{
                    color: isSelected ? '#FFFFFF' : isToday ? c.primary : c.textPrimary,
                    fontWeight: isSelected || isToday ? '700' : '400',
                  }}
                >
                  {day.format('D')}
                </Text>
              </View>

              <View
                style={[
                  styles.todayDot,
                  { backgroundColor: isToday && !isSelected ? c.primary : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
})
