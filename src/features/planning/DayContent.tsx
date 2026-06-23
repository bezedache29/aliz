import { useAtom, useAtomValue } from 'jotai'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'

import { Card } from '@/src/components/card'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { selectedDateAtom, weekPlanAtom } from '@/src/store/planningAtom'
import { spacing } from '@/src/styles/design-tokens'

import { MealSlot } from './MealSlot'

const MEAL_ORDER: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']

export function DayContent() {
  const c = useColors()
  const selectedDate = useAtomValue(selectedDateAtom)
  const [weekPlan, setWeekPlan] = useAtom(weekPlanAtom)

  const { refreshing, refresh } = useRefresh()

  const dateKey = selectedDate.format('YYYY-MM-DD')
  const dayMeals: PlannedMeal[] = weekPlan[dateKey] ?? []
  const totalKcal = dayMeals.reduce((sum, m) => sum + m.kcal, 0)

  const getMealForSlot = (meal: MealType) => dayMeals.find((m) => m.meal === meal)

  function handleRemove(meal: MealType) {
    setWeekPlan((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).filter((m) => m.meal !== meal),
    }))
  }

  const dayName = selectedDate.format('dddd').toUpperCase()
  const dayDate = selectedDate.format('D MMMM')
  const dayDateCapitalized = dayDate.charAt(0).toUpperCase() + dayDate.slice(1)

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
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
      {/* En-tête du jour */}
      <View style={styles.dateHeader}>
        <Text variant="label" color="muted" uppercase style={{ letterSpacing: 1 }}>
          {dayName}
        </Text>
        <Text variant="heading1" style={{ lineHeight: 34 }}>
          {dayDateCapitalized}
        </Text>
      </View>

      {/* Section repas */}
      <Text variant="label" color="muted" uppercase style={styles.sectionLabel}>
        Alimentation
      </Text>

      <Card noPadding style={{ paddingHorizontal: spacing.md }}>
        {MEAL_ORDER.map((meal, index) => (
          <MealSlot
            key={meal}
            meal={meal}
            planned={getMealForSlot(meal)}
            onAdd={() => {}}
            onRemove={() => handleRemove(meal)}
            showSeparator={index < MEAL_ORDER.length - 1}
          />
        ))}
      </Card>

      {/* Total kcal */}
      {totalKcal > 0 && (
        <View style={[styles.totalRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.5 }}>
            Total du jour
          </Text>
          <Text variant="heading3" color="accent" style={{ fontWeight: '700' }}>
            {totalKcal} kcal
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  dateHeader: {
    marginBottom: spacing.sm,
    gap: 2,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
})
