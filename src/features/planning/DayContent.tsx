import Ionicons from '@expo/vector-icons/Ionicons'
import { useAtomValue } from 'jotai'
import { RefreshControl, View } from 'react-native'
import tw from 'twrnc'

import { useActivities } from '@/src/apis/backendApi/hooks/activity/useActivities'
import { useJournalEntries } from '@/src/apis/backendApi/hooks/journal/useJournalEntries'
import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'
import { Card } from '@/src/components/card'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { ActivityRow } from '@/src/features/tracking/ActivityRow'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import {
  AI_SUGGESTION_MEAL_TYPES,
  type MealType,
  type PlannedRecipeCourse,
} from '@/src/models/planning/planning.model'
import { rejectedSuggestionsAtom, selectedDateAtom } from '@/src/store/planningAtom'

import { MealSlot } from './MealSlot'

const MEAL_ORDER: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']

export function DayContent() {
  const c = useColors()
  const selectedDate = useAtomValue(selectedDateAtom)
  const rejectedSuggestions = useAtomValue(rejectedSuggestionsAtom)

  const dateKey = selectedDate.format('YYYY-MM-DD')
  const dayName = selectedDate.format('dddd').toUpperCase()
  const dayDate = selectedDate.format('D MMMM')
  const mondayKey = selectedDate.startOf('isoWeek').format('YYYY-MM-DD')

  const { data: meals = [], refetch: refetchJournal } = useJournalEntries(dateKey)
  const { data: weekSlots = [] } = usePlanningWeek(mondayKey)
  const { data: activities = [], refetch: refetchActivities } = useActivities()
  const dayActivities = activities.filter((a) => selectedDate.isSame(a.startedAt, 'day'))

  function pendingSuggestions(meal: MealType): PlannedRecipeCourse[] {
    if (!AI_SUGGESTION_MEAL_TYPES.includes(meal)) return []
    const slot = weekSlots.find((s) => s.date === dateKey && s.meal === meal)
    if (!slot) return []
    return slot.courses.filter((course) => {
      if (rejectedSuggestions.includes(`${dateKey}:${meal}:${course.course}`)) return false
      return !meals.some(
        (m) => m.meal === meal && m.course === course.course && m.source === 'ai_suggestion',
      )
    })
  }

  const { refreshing, refresh } = useRefresh(() =>
    Promise.all([refetchJournal(), refetchActivities()]).then(() => {}),
  )

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`p-4 gap-2 pb-8`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={c.primary}
          colors={[c.primary]}
        />
      }
    >
      <View style={tw`mb-2 gap-0.5`}>
        <Text variant="label" color="muted" uppercase style={{ letterSpacing: 1 }}>
          {dayName}
        </Text>
        <Text variant="heading1" style={{ lineHeight: 34 }}>
          {dayDate}
        </Text>
      </View>

      <Text variant="label" color="muted" uppercase style={[tw`mb-1 mt-1`, { letterSpacing: 0.8 }]}>
        Repas
      </Text>

      <Card noPadding style={tw`px-4`}>
        {MEAL_ORDER.map((meal, index) => (
          <View key={meal}>
            {pendingSuggestions(meal).map((course) => (
              <View
                key={`${meal}-${course.course}`}
                style={[
                  tw`rounded-2xl p-3 mt-3 gap-1`,
                  {
                    backgroundColor: c.primary + '10',
                    borderWidth: 1,
                    borderColor: c.primary + '30',
                  },
                ]}
              >
                <View style={tw`flex-row items-center gap-2`}>
                  <Ionicons name="bulb-outline" size={14} color={c.primary} />
                  <Text variant="caption" style={{ color: c.primary, fontWeight: '700' }} uppercase>
                    {course.course ? `Suggestion IA · ${course.course}` : 'Suggestion IA'}
                  </Text>
                </View>
                <Text variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {course.recipe.name}
                </Text>
                <Text variant="caption" color="muted">
                  {course.recipe.kcal} kcal · pas encore validée, rendez-vous dans le Journal
                </Text>
              </View>
            ))}
            <MealSlot
              meal={meal}
              plannedItems={meals.filter((m) => m.meal === meal)}
              showSeparator={index < MEAL_ORDER.length - 1}
              readOnly
            />
          </View>
        ))}
      </Card>

      <View style={tw`mt-2 gap-2`}>
        <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
          Activités
        </Text>
        {dayActivities.length > 0 ? (
          <View style={tw`gap-2`}>
            {dayActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} showDate={false} />
            ))}
          </View>
        ) : (
          <Card>
            <View style={tw`items-center gap-1`}>
              <Ionicons name="bicycle-outline" size={28} color={c.textMuted} />
              <Text variant="body" color="muted">
                Aucune activité ce jour.
              </Text>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  )
}
