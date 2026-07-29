import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'
import dayjs from '@/src/config/dayjs'
import { AI_SUGGESTION_MEAL_TYPES, type MealType } from '@/src/models/planning/planning.model'

export interface MissingSlot {
  dateKey: string
  mealType: MealType
}

function computeMissingSlots(
  slots: { date: string; meal: MealType; courses: unknown[] }[],
): MissingSlot[] {
  const today = dayjs().startOf('day')
  const sunday = dayjs().startOf('isoWeek').add(6, 'day')
  const missing: MissingSlot[] = []

  let cursor = today
  while (!cursor.isAfter(sunday, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    for (const mealType of AI_SUGGESTION_MEAL_TYPES) {
      const hasSlot = slots.some(
        (s) => s.date === dateKey && s.meal === mealType && s.courses.length > 0,
      )
      if (!hasSlot) missing.push({ dateKey, mealType })
    }
    cursor = cursor.add(1, 'day')
  }
  return missing
}

export function useMissingWeeklySuggestions() {
  const mondayKey = dayjs().startOf('isoWeek').format('YYYY-MM-DD')
  const { data: slots = [], isLoading } = usePlanningWeek(mondayKey)
  const missingSlots = isLoading ? [] : computeMissingSlots(slots)
  return { missingSlots, isLoading }
}
