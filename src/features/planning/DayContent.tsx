import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAtomValue } from 'jotai'
import { useRef, useState } from 'react'
import { RefreshControl, View } from 'react-native'
import tw from 'twrnc'

import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'
import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import type { MealType } from '@/src/models/planning/planning.model'
import { selectedDateAtom } from '@/src/store/planningAtom'

import { MealEditSheet } from './MealEditSheet'
import { RecipeSlot } from './RecipeSlot'

const MEAL_ORDER: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']

export function DayContent() {
  const c = useColors()
  const selectedDate = useAtomValue(selectedDateAtom)
  const { refreshing, refresh } = useRefresh()

  const sheetRef = useRef<BottomSheetModal>(null)
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null)
  const [regeneratingMeals, setRegeneratingMeals] = useState<Set<MealType>>(new Set())

  const dateKey = selectedDate.format('YYYY-MM-DD')
  const dayName = selectedDate.format('dddd').toUpperCase()
  const dayDate = selectedDate.format('D MMMM')

  const { data: slots = [], isLoading } = usePlanningWeek(dateKey)
  const regenerateMutation = useRegenerateMealSlot()

  function handleSlotPress(meal: MealType) {
    setActiveMeal(meal)
    sheetRef.current?.present()
  }

  function handleRegenerate() {
    if (!activeMeal) return
    sheetRef.current?.dismiss()
    setRegeneratingMeals((prev) => new Set([...prev, activeMeal]))
    regenerateMutation.mutate(
      { dateKey, mealType: activeMeal },
      {
        onSettled: () => {
          setRegeneratingMeals((prev) => {
            const next = new Set(prev)
            next.delete(activeMeal)
            return next
          })
        },
      },
    )
  }

  function handleSendPrompt(prompt: string) {
    if (!activeMeal) return
    sheetRef.current?.dismiss()
    setRegeneratingMeals((prev) => new Set([...prev, activeMeal]))
    regenerateMutation.mutate(
      { dateKey, mealType: activeMeal, prompt },
      {
        onSettled: () => {
          setRegeneratingMeals((prev) => {
            const next = new Set(prev)
            next.delete(activeMeal)
            return next
          })
        },
      },
    )
  }

  const activeSlot = slots.find((s) => s.meal === activeMeal)

  return (
    <>
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

        <Text
          variant="label"
          color="muted"
          uppercase
          style={[tw`mb-1 mt-1`, { letterSpacing: 0.8 }]}
        >
          {"Suggestions de l'IA"}
        </Text>

        <View
          style={[
            tw`rounded-2xl overflow-hidden px-4`,
            { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
          ]}
        >
          {MEAL_ORDER.map((meal, index) => {
            const slot = slots.find((s) => s.meal === meal)
            const isRegenerating = regeneratingMeals.has(meal)
            return (
              <RecipeSlot
                key={meal}
                meal={meal}
                status={isLoading || isRegenerating ? 'loading' : (slot?.status ?? 'idle')}
                recipe={slot?.recipe}
                onPress={() => handleSlotPress(meal)}
                showSeparator={index < MEAL_ORDER.length - 1}
              />
            )
          })}
        </View>
      </ScrollView>

      <MealEditSheet
        ref={sheetRef}
        mealType={activeMeal ?? 'Déjeuner'}
        recipeName={activeSlot?.recipe?.name}
        onRegenerate={handleRegenerate}
        onSendPrompt={handleSendPrompt}
      />
    </>
  )
}
