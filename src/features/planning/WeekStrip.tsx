import Ionicons from '@expo/vector-icons/Ionicons'
import dayjs from '@/src/config/dayjs'
import { Dayjs } from 'dayjs'
import { useAtom } from 'jotai'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import tw from 'twrnc'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { selectedDateAtom } from '@/src/store/planningAtom'

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export function WeekStrip() {
  const c = useColors()
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom)

  const startOfWeek = selectedDate.startOf('isoWeek')
  const today = dayjs()

  const days: Dayjs[] = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))

  const weekLabel = `${startOfWeek.format('D')} – ${startOfWeek.add(6, 'day').format('D MMMM YYYY')}`

  return (
    <View
      style={[
        tw`pt-2 pb-4 px-4`,
        {
          backgroundColor: c.surface,
          borderBottomColor: c.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      {/* Navigation semaine */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <TouchableOpacity
          testID="prev-week"
          onPress={() => setSelectedDate(selectedDate.subtract(1, 'week'))}
          hitSlop={12}
          style={[
            tw`w-7 h-7 rounded-full items-center justify-center`,
            { backgroundColor: c.surfaceElevated },
          ]}
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
          style={[
            tw`w-7 h-7 rounded-full items-center justify-center`,
            { backgroundColor: c.surfaceElevated },
          ]}
        >
          <Ionicons name="chevron-forward" size={16} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Jours */}
      <View style={tw`flex-row justify-between`}>
        {days.map((day, index) => {
          const isSelected = day.isSame(selectedDate, 'day')
          const isToday = day.isSame(today, 'day')

          return (
            <TouchableOpacity
              key={index}
              style={tw`flex-1 items-center gap-1`}
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

              <View
                style={[
                  tw`w-9 h-9 rounded-full overflow-hidden items-center justify-center`,
                  isSelected && { backgroundColor: c.primary },
                ]}
              >
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
                  tw`w-1 h-1 rounded-full`,
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
