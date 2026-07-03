import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useRef, useState } from 'react'
import { RefreshControl, TouchableOpacity, View } from 'react-native'
import { MealItemEditSheet } from '@/src/features/planning/MealItemEditSheet'

import { ScrollView } from '@/src/components/scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import { AvatarButton } from '@/src/components/avatar-button'
import { Card } from '@/src/components/card'
import { CircleBar } from '@/src/components/circle-bar'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { MealAddPickerSheet } from '@/src/features/planning/MealAddPickerSheet'
import { MealSlot } from '@/src/features/planning/MealSlot'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { weekPlanAtom } from '@/src/store/planningAtom'
import { spacing } from '@/src/styles/design-tokens'
import { calculateNutritionalGoals } from '@/src/utils/nutrition'

const MEAL_ORDER: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']

function formatKcal(n: number): string {
  if (n >= 1000) {
    return `${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, '0')}`
  }
  return String(n)
}

export default function JournalScreen() {
  const c = useColors()
  const router = useRouter()
  const onboarding = useAtomValue(onboardingAtom)
  const [weekPlan, setWeekPlan] = useAtom(weekPlanAtom)
  const pickerSheetRef = useRef<BottomSheetModal>(null)
  const editItemSheetRef = useRef<BottomSheetModal>(null)
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null)
  const [editingItem, setEditingItem] = useState<PlannedMeal | null>(null)

  const todayKey = dayjs().format('YYYY-MM-DD')
  const todayMeals: PlannedMeal[] = weekPlan[todayKey] ?? []

  const consumedKcal = todayMeals.reduce((sum, m) => sum + m.kcal, 0)
  const consumedProteines = todayMeals.reduce((sum, m) => sum + m.proteines, 0)
  const consumedGlucides = todayMeals.reduce((sum, m) => sum + m.glucides, 0)
  const consumedLipides = todayMeals.reduce((sum, m) => sum + m.lipides, 0)

  const goals =
    onboarding.currentWeight &&
    onboarding.height &&
    onboarding.age &&
    onboarding.sex &&
    onboarding.activityLevel &&
    onboarding.targetWeight &&
    onboarding.weeklyLossKg
      ? calculateNutritionalGoals(
          onboarding.currentWeight,
          onboarding.height,
          onboarding.age,
          onboarding.sex,
          onboarding.activityLevel,
          onboarding.targetWeight,
          onboarding.weeklyLossKg,
        )
      : null

  const dateLabel = dayjs().format('dddd D MMMM')
  const dateFormatted = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const burned = 0
  const remaining = goals ? Math.max(0, goals.dailyKcalAdjusted - consumedKcal + burned) : 0

  const { data: weightHistory = [], isLoading: weightLoading } = useWeightHistory()
  const sortedWeights = [...weightHistory]
    .filter((e) => !!e.measuredAt)
    .sort((a, b) => (b.measuredAt < a.measuredAt ? -1 : b.measuredAt > a.measuredAt ? 1 : 0))
  const latestWeight = sortedWeights[0] ?? null

  function computeWeightTrend(): 'up' | 'stable' | 'down' {
    const withWeight = weightHistory.filter((e) => e.weight !== null && !!e.measuredAt)
    if (withWeight.length < 2) return 'stable'
    const asc = [...withWeight].sort((a, b) =>
      a.measuredAt! < b.measuredAt! ? -1 : a.measuredAt! > b.measuredAt! ? 1 : 0,
    )
    const diff = asc[asc.length - 1].weight! - asc[asc.length - 2].weight!
    if (diff > 0.2) return 'up'
    if (diff < -0.2) return 'down'
    return 'stable'
  }

  const weightTrend = computeWeightTrend()
  const weightTrendIcons = {
    up: 'trending-up',
    stable: 'remove-outline',
    down: 'trending-down',
  } as const
  const weightTrendColors = { up: c.danger, stable: c.info, down: c.primary }
  const weightTrendIcon = weightTrendIcons[weightTrend]
  const weightTrendColor = weightTrendColors[weightTrend]

  const { refreshing, refresh } = useRefresh()

  const handleAddMeal = useCallback((meal: MealType) => {
    setActiveMeal(meal)
    pickerSheetRef.current?.present()
  }, [])

  function handlePressItem(item: PlannedMeal) {
    setEditingItem(item)
    editItemSheetRef.current?.present()
  }

  function handleUpdateItem(updated: PlannedMeal) {
    setWeekPlan((prev) => ({
      ...prev,
      [todayKey]: (prev[todayKey] ?? []).map((m) => (m.id === updated.id ? updated : m)),
    }))
    editItemSheetRef.current?.dismiss()
  }

  function handleDeleteItem(id: string) {
    setWeekPlan((prev) => ({
      ...prev,
      [todayKey]: (prev[todayKey] ?? []).filter((m) => m.id !== id),
    }))
    editItemSheetRef.current?.dismiss()
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[tw`flex-1`, { backgroundColor: c.background }]}
    >
      <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-4`}>
        <Text variant="heading1" style={{ fontWeight: '700' }}>
          {onboarding.firstName ? `Bonjour, ${onboarding.firstName} !` : 'Bonjour !'}
        </Text>
        <AvatarButton />
      </View>

      <ScrollView
        contentContainerStyle={tw`p-4 gap-4 pt-1`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[c.primary]} />
        }
      >
        <Text variant="body" color="secondary">
          {dateFormatted}
        </Text>

        {goals && (
          <Card>
            <View style={tw`flex-row justify-between items-center`}>
              <Text variant="label" color="muted" uppercase>
                Résumé du jour
              </Text>
            </View>
            <View style={[tw`flex-row items-center justify-between`, { marginTop: spacing.md }]}>
              <StatItem label="Mangées" value={formatKcal(consumedKcal)} unit="kcal" size="sm" />
              <CircleBar
                value={consumedKcal}
                max={Math.max(1, goals.dailyKcalAdjusted)}
                size={150}
                strokeWidth={12}
                arcAngle={270}
              >
                <Text variant="heading2" style={{ fontWeight: '700' }}>
                  {formatKcal(remaining)}
                </Text>
                <Text variant="caption" color="secondary">
                  Restantes
                </Text>
              </CircleBar>
              <StatItem label="Brûlées" value={formatKcal(burned)} unit="kcal" size="sm" />
            </View>

            <View style={[tw`h-px`, { marginVertical: spacing.md, backgroundColor: c.border }]} />

            <Text variant="label" color="muted" uppercase style={tw`mb-2`}>
              Macros
            </Text>
            <View style={tw`flex-row gap-4`}>
              <View style={tw`flex-1 gap-1`}>
                <Text variant="caption" color="secondary">
                  Protéines
                </Text>
                <View
                  style={[
                    tw`h-1.5 rounded-full overflow-hidden`,
                    { backgroundColor: c.surfaceElevated },
                  ]}
                >
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        backgroundColor:
                          consumedProteines >= goals.macros.proteines ? c.danger : c.tertiary,
                        width: `${Math.min((consumedProteines / Math.max(1, goals.macros.proteines)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {consumedProteines} / {goals.macros.proteines} g
                </Text>
              </View>
              <View style={tw`flex-1 gap-1`}>
                <Text variant="caption" color="secondary">
                  Glucides
                </Text>
                <View
                  style={[
                    tw`h-1.5 rounded-full overflow-hidden`,
                    { backgroundColor: c.surfaceElevated },
                  ]}
                >
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        backgroundColor:
                          consumedGlucides >= goals.macros.glucides ? c.danger : c.warning,
                        width: `${Math.min((consumedGlucides / Math.max(1, goals.macros.glucides)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {consumedGlucides} / {goals.macros.glucides} g
                </Text>
              </View>
              <View style={tw`flex-1 gap-1`}>
                <Text variant="caption" color="secondary">
                  Lipides
                </Text>
                <View
                  style={[
                    tw`h-1.5 rounded-full overflow-hidden`,
                    { backgroundColor: c.surfaceElevated },
                  ]}
                >
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        backgroundColor:
                          consumedLipides >= goals.macros.lipides ? c.danger : c.info,
                        width: `${Math.min((consumedLipides / Math.max(1, goals.macros.lipides)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {consumedLipides} / {goals.macros.lipides} g
                </Text>
              </View>
            </View>
          </Card>
        )}

        <View style={tw`gap-2`}>
          <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
            Alimentation
          </Text>
          <Card noPadding style={tw`px-4`}>
            {MEAL_ORDER.map((meal, index) => (
              <MealSlot
                key={meal}
                meal={meal}
                plannedItems={todayMeals.filter((m) => m.meal === meal)}
                onAdd={() => handleAddMeal(meal)}
                onPressItem={handlePressItem}
                showSeparator={index < MEAL_ORDER.length - 1}
              />
            ))}
          </Card>
        </View>

        {goals && (
          <Card>
            <Text variant="label" color="muted" uppercase>
              Objectif nutritionnel
            </Text>
            <View style={[tw`flex-row justify-between`, { marginTop: spacing.md }]}>
              <StatItem label="BMR" value={formatKcal(goals.bmr)} unit="kcal" size="sm" />
              <StatItem label="TDEE" value={formatKcal(goals.tdeeBase)} unit="kcal" size="sm" />
              <StatItem
                label="Objectif"
                value={formatKcal(goals.dailyKcalBase)}
                unit="kcal"
                size="sm"
              />
            </View>

            <View style={[tw`h-px`, { marginVertical: spacing.md, backgroundColor: c.border }]} />

            <View style={tw`flex-row justify-between items-center`}>
              <Text variant="caption" color="secondary">
                Rythme
              </Text>
              <Text variant="label">{onboarding.weeklyLossKg} kg / semaine</Text>
            </View>
            {goals.estimatedWeeks > 0 && (
              <View style={[tw`flex-row justify-between items-center`, { marginTop: spacing.xs }]}>
                <Text variant="caption" color="secondary">
                  Durée estimée
                </Text>
                <Text variant="label">{goals.estimatedWeeks} semaines</Text>
              </View>
            )}
          </Card>
        )}

        {!weightLoading && (latestWeight ?? onboarding.currentWeight) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(drawer)/(tabs)/tracking')}
          >
            <Card>
              <View style={tw`flex-row justify-between items-center`}>
                <Text variant="label" color="muted" uppercase>
                  Poids
                </Text>
                <View style={tw`flex-row items-center gap-2`}>
                  <View
                    style={[
                      tw`flex-row items-center gap-1 px-2 rounded-full`,
                      { paddingVertical: 4, backgroundColor: c.surfaceElevated },
                    ]}
                  >
                    <Ionicons name={weightTrendIcon} size={13} color={weightTrendColor} />
                    <Text variant="label" style={{ color: weightTrendColor }}>
                      {{ up: 'En hausse', stable: 'Stable', down: 'En baisse' }[weightTrend]}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                </View>
              </View>

              <View style={[tw`items-center`, { marginVertical: spacing.lg }]}>
                <View style={tw`flex-row items-end`}>
                  <Text
                    style={{
                      fontSize: 64,
                      fontWeight: '900',
                      lineHeight: 64,
                      color: c.textPrimary,
                      letterSpacing: -2,
                    }}
                  >
                    {latestWeight?.weight?.toFixed(1) ?? onboarding.currentWeight}
                  </Text>
                  <Text variant="heading2" color="muted" style={{ marginBottom: 6, marginLeft: 6 }}>
                    kg
                  </Text>
                </View>
                {latestWeight?.measuredAt && (
                  <Text variant="caption" color="muted">
                    {dayjs(latestWeight.measuredAt).format('dddd D MMMM')}
                  </Text>
                )}
              </View>

              {onboarding.targetWeight && (
                <>
                  <View style={[tw`h-px`, { backgroundColor: c.border }]} />
                  <View
                    style={[tw`flex-row justify-between items-center`, { marginTop: spacing.md }]}
                  >
                    <Text variant="caption" color="secondary">
                      Objectif
                    </Text>
                    <View style={tw`flex-row items-end gap-1`}>
                      <Text variant="heading3" style={{ fontWeight: '600' }}>
                        {onboarding.targetWeight}
                      </Text>
                      <Text variant="caption" color="muted" style={{ marginBottom: 2 }}>
                        kg
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </Card>
          </TouchableOpacity>
        )}
      </ScrollView>

      <MealAddPickerSheet
        ref={pickerSheetRef}
        mealType={activeMeal}
        onSelectFood={() => {
          pickerSheetRef.current?.dismiss()
          if (activeMeal) router.push(`/food-search?mealType=${encodeURIComponent(activeMeal)}`)
        }}
        onSelectRecipe={() => {
          pickerSheetRef.current?.dismiss()
          if (activeMeal) router.push(`/recipe-search?mealType=${encodeURIComponent(activeMeal)}`)
        }}
      />

      <MealItemEditSheet
        ref={editItemSheetRef}
        item={editingItem}
        mealType={editingItem?.meal ?? 'Déjeuner'}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />
    </SafeAreaView>
  )
}
