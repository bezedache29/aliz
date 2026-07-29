import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useRef, useState } from 'react'
import { RefreshControl, ToastAndroid, TouchableOpacity, View } from 'react-native'
import { MealItemEditSheet } from '@/src/features/planning/MealItemEditSheet'

import { ScrollView } from '@/src/components/scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useActivities } from '@/src/apis/backendApi/hooks/activity/useActivities'
import { useActivitySync } from '@/src/apis/backendApi/hooks/activity/useActivitySync'
import { useCreateJournalEntry } from '@/src/apis/backendApi/hooks/journal/useCreateJournalEntry'
import { useDeleteJournalEntry } from '@/src/apis/backendApi/hooks/journal/useDeleteJournalEntry'
import { useJournalEntries } from '@/src/apis/backendApi/hooks/journal/useJournalEntries'
import { useUpdateJournalEntry } from '@/src/apis/backendApi/hooks/journal/useUpdateJournalEntry'
import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'
import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'
import { useStravaStatus } from '@/src/apis/backendApi/hooks/strava/useStravaStatus'
import { useCreateStock } from '@/src/apis/backendApi/hooks/stock/useCreateStock'
import { useDeleteStock } from '@/src/apis/backendApi/hooks/stock/useDeleteStock'
import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import { useUpdateStock } from '@/src/apis/backendApi/hooks/stock/useUpdateStock'
import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import { AvatarButton } from '@/src/components/avatar-button'
import { Card } from '@/src/components/card'
import { CircleBar } from '@/src/components/circle-bar'
import { StatItem } from '@/src/components/stat-item'
import { Text } from '@/src/components/text'
import dayjs from '@/src/config/dayjs'
import { ActivityRow } from '@/src/features/tracking/ActivityRow'
import { AiSuggestionCard } from '@/src/features/journal/AiSuggestionCard'
import { IngredientEditSheet } from '@/src/features/journal/IngredientEditSheet'
import { RegeneratePromptSheet } from '@/src/features/journal/RegeneratePromptSheet'
import { RecipeDetailSheet } from '@/src/features/journal/RecipeDetailSheet'
import { WeeklyGenerationBanner } from '@/src/features/journal/WeeklyGenerationBanner'
import { MealAddPickerSheet } from '@/src/features/planning/MealAddPickerSheet'
import { MealSlot } from '@/src/features/planning/MealSlot'
import { useColors } from '@/src/hooks/use-colors'
import { useRefresh } from '@/src/hooks/use-refresh'
import {
  AI_SUGGESTION_MEAL_TYPES,
  MealType,
  PlannedRecipeCourse,
  PlannedMeal,
} from '@/src/models/planning/planning.model'
import {
  buildStockDeduction,
  computeStockRestoration,
  deductStockQuantity,
  findMatchingStockItem,
  type StockDeduction,
} from '@/src/models/stock/stock-item.model'
import { computeRecipeNutrition, type RecipeIngredient } from '@/src/models/recipe/recipe.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { rejectedSuggestionsAtom } from '@/src/store/planningAtom'
import { spacing } from '@/src/styles/design-tokens'
import { applyBurnedCalories, calculateNutritionalGoals } from '@/src/utils/nutrition'
import { getLatestWeightEntry } from '@/src/utils/weight'

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
  const todayKey = dayjs().format('YYYY-MM-DD')
  const { data: todayMeals = [], refetch: refetchJournal } = useJournalEntries(todayKey)
  const { mutate: createJournalEntry } = useCreateJournalEntry()
  const { mutate: updateJournalEntry } = useUpdateJournalEntry()
  const { mutate: deleteJournalEntry } = useDeleteJournalEntry()
  const { data: stockItems = [] } = useStock()
  const { mutate: updateStock } = useUpdateStock()
  const { mutate: createStock } = useCreateStock()
  const { mutate: deleteStock } = useDeleteStock()
  const mondayKey = dayjs().startOf('isoWeek').format('YYYY-MM-DD')
  const { data: weekSlots = [] } = usePlanningWeek(mondayKey)
  const aiSlots = weekSlots.filter((s) => s.date === todayKey)
  const regenerateMutation = useRegenerateMealSlot()
  const [regeneratingMeals, setRegeneratingMeals] = useState<Set<MealType>>(new Set())
  const pickerSheetRef = useRef<BottomSheetModal>(null)
  const editItemSheetRef = useRef<BottomSheetModal>(null)
  const ingredientEditSheetRef = useRef<BottomSheetModal>(null)
  const regeneratePromptSheetRef = useRef<BottomSheetModal>(null)
  const recipeDetailSheetRef = useRef<BottomSheetModal>(null)
  const [activeMeal, setActiveMeal] = useState<MealType | null>(null)
  const [editingItem, setEditingItem] = useState<PlannedMeal | null>(null)
  const [modifyingSuggestion, setModifyingSuggestion] = useState<{
    mealType: MealType
    course: PlannedRecipeCourse
  } | null>(null)
  const [regeneratingMealType, setRegeneratingMealType] = useState<MealType | null>(null)
  const [viewingSuggestion, setViewingSuggestion] = useState<PlannedRecipeCourse | null>(null)
  const [rejectedSuggestions, setRejectedSuggestions] = useAtom(rejectedSuggestionsAtom)

  function suggestionKey(mealType: MealType, course: PlannedRecipeCourse): string {
    return `${todayKey}:${mealType}:${course.course}`
  }

  function pendingSuggestions(mealType: MealType): PlannedRecipeCourse[] {
    const slot = aiSlots.find((s) => s.meal === mealType)
    if (!slot) return []
    return slot.courses.filter((course) => {
      if (rejectedSuggestions.includes(suggestionKey(mealType, course))) return false
      return !todayMeals.some(
        (m) => m.meal === mealType && m.course === course.course && m.source === 'ai_suggestion',
      )
    })
  }

  function handleRejectSuggestion(mealType: MealType, course: PlannedRecipeCourse) {
    setRejectedSuggestions((prev) => [...prev, suggestionKey(mealType, course)])
  }

  function deductIngredientsFromStock(ingredients: RecipeIngredient[]): StockDeduction[] {
    const stockDeductions: StockDeduction[] = []
    for (const ingredient of ingredients) {
      const stockItem = findMatchingStockItem(stockItems, ingredient.food)
      if (!stockItem) continue
      const newQuantity = deductStockQuantity(stockItem, ingredient.quantityG)
      stockDeductions.push(buildStockDeduction(stockItem, stockItem.quantity - newQuantity))
      if (newQuantity <= 0) {
        deleteStock(stockItem.id)
      } else {
        updateStock({ ...stockItem, quantity: newQuantity })
      }
    }
    return stockDeductions
  }

  function handleAcceptSuggestion(mealType: MealType, course: PlannedRecipeCourse) {
    const { recipe } = course
    const stockDeductions = deductIngredientsFromStock(recipe.ingredients)

    createJournalEntry({
      meal: {
        name: recipe.name,
        meal: mealType,
        kcal: recipe.kcal,
        proteines: recipe.proteines,
        glucides: recipe.glucides,
        lipides: recipe.lipides,
        course: course.course,
        source: 'ai_suggestion',
        suggestionStatus: 'accepted',
        ...(stockDeductions.length > 0 ? { stockDeductions } : {}),
      },
      dateKey: todayKey,
    })

    if (stockDeductions.length > 0) {
      ToastAndroid.show(
        `Provisions mises à jour (${stockDeductions.length} ingrédient${stockDeductions.length > 1 ? 's' : ''})`,
        ToastAndroid.SHORT,
      )
    }
  }

  function handleRegenerateSuggestion(mealType: MealType, prompt?: string) {
    setRegeneratingMeals((prev) => new Set([...prev, mealType]))
    regenerateMutation.mutate(
      { dateKey: todayKey, mealType, prompt },
      {
        onSettled: () => {
          setRegeneratingMeals((prev) => {
            const next = new Set(prev)
            next.delete(mealType)
            return next
          })
        },
      },
    )
  }

  function handleOpenRegeneratePrompt(mealType: MealType) {
    setRegeneratingMealType(mealType)
    regeneratePromptSheetRef.current?.present()
  }

  function handleConfirmRegeneratePrompt(prompt: string) {
    if (regeneratingMealType) handleRegenerateSuggestion(regeneratingMealType, prompt || undefined)
    regeneratePromptSheetRef.current?.dismiss()
  }

  function handleModifySuggestion(mealType: MealType, course: PlannedRecipeCourse) {
    setModifyingSuggestion({ mealType, course })
    ingredientEditSheetRef.current?.present()
  }

  function handleViewSuggestionDetails(course: PlannedRecipeCourse) {
    setViewingSuggestion(course)
    recipeDetailSheetRef.current?.present()
  }

  function handleConfirmModifiedSuggestion(ingredients: RecipeIngredient[]) {
    if (!modifyingSuggestion) return
    const { mealType, course } = modifyingSuggestion
    const nutrition = computeRecipeNutrition(ingredients, 1)
    const stockDeductions = deductIngredientsFromStock(ingredients)

    createJournalEntry({
      meal: {
        name: course.recipe.name,
        meal: mealType,
        ...nutrition,
        course: course.course,
        source: 'ai_suggestion',
        suggestionStatus: 'modified',
        ...(stockDeductions.length > 0 ? { stockDeductions } : {}),
      },
      dateKey: todayKey,
    })

    if (stockDeductions.length > 0) {
      ToastAndroid.show(
        `Provisions mises à jour (${stockDeductions.length} ingrédient${stockDeductions.length > 1 ? 's' : ''})`,
        ToastAndroid.SHORT,
      )
    }

    setModifyingSuggestion(null)
    ingredientEditSheetRef.current?.dismiss()
  }

  const consumedKcal = todayMeals.reduce((sum, m) => sum + m.kcal, 0)
  const consumedProteines = todayMeals.reduce((sum, m) => sum + m.proteines, 0)
  const consumedGlucides = todayMeals.reduce((sum, m) => sum + m.glucides, 0)
  const consumedLipides = todayMeals.reduce((sum, m) => sum + m.lipides, 0)

  const {
    data: weightHistory = [],
    isLoading: weightLoading,
    refetch: refetchWeight,
  } = useWeightHistory()
  const latestWeight = getLatestWeightEntry(weightHistory)
  const currentWeight = latestWeight?.weight ?? onboarding.currentWeight

  const goals =
    currentWeight &&
    onboarding.height &&
    onboarding.age &&
    onboarding.sex &&
    onboarding.activityLevel &&
    onboarding.targetWeight &&
    onboarding.weeklyLossKg
      ? calculateNutritionalGoals(
          currentWeight,
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

  const { data: activities = [], refetch: refetchActivities } = useActivities()
  const { data: stravaStatus } = useStravaStatus()
  const { mutateAsync: syncActivities } = useActivitySync()
  const todayActivities = activities.filter((a) => dayjs(a.startedAt).isSame(dayjs(), 'day'))
  const burned = todayActivities.reduce((sum, a) => sum + (a.calories ?? 0), 0)
  const adjustedGoals = goals ? applyBurnedCalories(goals, burned) : null
  const remaining = adjustedGoals ? Math.max(0, adjustedGoals.dailyKcalAdjusted - consumedKcal) : 0

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

  const { refreshing, refresh } = useRefresh(() =>
    Promise.all([
      refetchWeight(),
      refetchJournal(),
      stravaStatus?.connected ? syncActivities() : refetchActivities(),
    ]).then(() => {}),
  )

  const handleAddMeal = useCallback((meal: MealType) => {
    setActiveMeal(meal)
    pickerSheetRef.current?.present()
  }, [])

  function handlePressItem(item: PlannedMeal) {
    setEditingItem(item)
    editItemSheetRef.current?.present()
  }

  function handleUpdateItem(updated: PlannedMeal) {
    let finalMeal = updated

    if (updated.stockDeductions?.length === 1 && updated.quantityG != null) {
      const oldDeduction = updated.stockDeductions[0]
      const stockItem = stockItems.find((s) => s.id === oldDeduction.stockItemId)
      if (stockItem) {
        const restoredQuantity = stockItem.quantity + oldDeduction.quantityDeducted
        const newQuantity = deductStockQuantity(
          { ...stockItem, quantity: restoredQuantity },
          updated.quantityG,
        )
        const quantityDeducted = restoredQuantity - newQuantity
        finalMeal = { ...updated, stockDeductions: [{ ...oldDeduction, quantityDeducted }] }

        if (newQuantity <= 0) {
          deleteStock(stockItem.id)
          ToastAndroid.show(`${stockItem.name} : provisions épuisées`, ToastAndroid.SHORT)
        } else {
          updateStock({ ...stockItem, quantity: newQuantity })
          ToastAndroid.show(`Provisions ajustées : ${stockItem.name}`, ToastAndroid.SHORT)
        }
      }
    }

    updateJournalEntry({ meal: finalMeal, dateKey: todayKey })
    editItemSheetRef.current?.dismiss()
  }

  function handleDeleteItem(id: string) {
    const deletedMeal = todayMeals.find((m) => m.id === id)
    if (deletedMeal?.stockDeductions?.length) {
      for (const deduction of deletedMeal.stockDeductions) {
        const restoration = computeStockRestoration(deduction, stockItems)
        if (restoration.action === 'update') {
          updateStock(restoration.item)
        } else {
          createStock(restoration.item)
        }
      }
      ToastAndroid.show('Provisions restaurées', ToastAndroid.SHORT)
    }

    deleteJournalEntry({ id, dateKey: todayKey })
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
        <WeeklyGenerationBanner />

        <Text variant="body" color="secondary">
          {dateFormatted}
        </Text>

        {adjustedGoals && (
          <Card>
            <View style={tw`flex-row justify-between items-center`}>
              <Text variant="label" color="muted" uppercase>
                Résumé du jour
              </Text>
            </View>
            <View style={[tw`flex-row items-center justify-between`, { marginTop: spacing.md }]}>
              <View style={tw`items-center gap-1`}>
                <CircleBar
                  value={consumedKcal}
                  max={Math.max(1, adjustedGoals.dailyKcalAdjusted)}
                  size={64}
                  strokeWidth={6}
                  arcAngle={360}
                  color={c.primary}
                >
                  <Ionicons name="restaurant" size={18} color={c.primary} />
                </CircleBar>
                <Text variant="label" style={{ fontWeight: '700' }}>
                  {formatKcal(consumedKcal)}
                </Text>
                <Text variant="caption" color="muted">
                  Mangées
                </Text>
              </View>

              <CircleBar
                value={consumedKcal}
                max={Math.max(1, adjustedGoals.dailyKcalAdjusted)}
                size={150}
                strokeWidth={12}
                arcAngle={270}
                color={
                  consumedKcal >= adjustedGoals.dailyKcalAdjusted
                    ? c.danger
                    : consumedKcal >= adjustedGoals.dailyKcalAdjusted * 0.8
                      ? c.warning
                      : c.primary
                }
              >
                <Text variant="heading2" style={{ fontWeight: '700' }}>
                  {formatKcal(remaining)}
                </Text>
                <Text variant="caption" color="secondary">
                  Restantes
                </Text>
              </CircleBar>

              <View style={tw`items-center gap-1`}>
                <CircleBar
                  value={burned}
                  max={Math.max(1, adjustedGoals.dailyKcalAdjusted)}
                  size={64}
                  strokeWidth={6}
                  arcAngle={360}
                  color={c.warning}
                >
                  <Ionicons name="flame" size={18} color={c.warning} />
                </CircleBar>
                <Text variant="label" style={{ fontWeight: '700' }}>
                  {formatKcal(burned)}
                </Text>
                <Text variant="caption" color="muted">
                  Brûlées
                </Text>
              </View>
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
                          consumedProteines >= adjustedGoals.macros.proteines
                            ? c.danger
                            : c.tertiary,
                        width: `${Math.min((consumedProteines / Math.max(1, adjustedGoals.macros.proteines)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {Math.round(consumedProteines)} / {adjustedGoals.macros.proteines} g
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
                          consumedGlucides >= adjustedGoals.macros.glucides ? c.danger : c.warning,
                        width: `${Math.min((consumedGlucides / Math.max(1, adjustedGoals.macros.glucides)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {Math.round(consumedGlucides)} / {adjustedGoals.macros.glucides} g
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
                          consumedLipides >= adjustedGoals.macros.lipides ? c.danger : c.info,
                        width: `${Math.min((consumedLipides / Math.max(1, adjustedGoals.macros.lipides)) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="muted">
                  {Math.round(consumedLipides)} / {adjustedGoals.macros.lipides} g
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
              <View key={meal}>
                {AI_SUGGESTION_MEAL_TYPES.includes(meal) &&
                  pendingSuggestions(meal).map((course) => (
                    <AiSuggestionCard
                      key={`${meal}-${course.course}`}
                      suggestion={course}
                      onAccept={() => handleAcceptSuggestion(meal, course)}
                      onModify={() => handleModifySuggestion(meal, course)}
                      onRegenerate={() => handleRegenerateSuggestion(meal)}
                      onOpenRegeneratePrompt={() => handleOpenRegeneratePrompt(meal)}
                      onReject={() => handleRejectSuggestion(meal, course)}
                      onViewDetails={() => handleViewSuggestionDetails(course)}
                      isRegenerating={regeneratingMeals.has(meal)}
                    />
                  ))}
                <MealSlot
                  meal={meal}
                  plannedItems={todayMeals.filter((m) => m.meal === meal)}
                  onAdd={() => handleAddMeal(meal)}
                  onPressItem={handlePressItem}
                  showSeparator={index < MEAL_ORDER.length - 1}
                />
              </View>
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

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(drawer)/(tabs)/tracking')}
        >
          <View style={tw`gap-2`}>
            <Text variant="label" color="muted" uppercase style={{ letterSpacing: 0.8 }}>
              Activités du jour
            </Text>
            {todayActivities.length > 0 ? (
              <View style={tw`gap-2`}>
                {todayActivities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} showDate={false} />
                ))}
              </View>
            ) : (
              <Card>
                <View style={tw`items-center gap-1`}>
                  <Ionicons name="bicycle-outline" size={28} color={c.textMuted} />
                  <Text variant="body" color="muted">
                    Aucune activité aujourd&apos;hui.
                  </Text>
                </View>
              </Card>
            )}
          </View>
        </TouchableOpacity>
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
        onSelectAiRecipe={() => {
          pickerSheetRef.current?.dismiss()
          if (activeMeal) router.push(`/recipe-generate?mealType=${encodeURIComponent(activeMeal)}`)
        }}
      />

      <MealItemEditSheet
        ref={editItemSheetRef}
        item={editingItem}
        mealType={editingItem?.meal ?? 'Déjeuner'}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      <IngredientEditSheet
        ref={ingredientEditSheetRef}
        suggestion={modifyingSuggestion?.course ?? null}
        mealType={modifyingSuggestion?.mealType ?? 'Déjeuner'}
        onConfirm={handleConfirmModifiedSuggestion}
      />

      <RegeneratePromptSheet
        ref={regeneratePromptSheetRef}
        onConfirm={handleConfirmRegeneratePrompt}
      />

      <RecipeDetailSheet ref={recipeDetailSheetRef} course={viewingSuggestion} />
    </SafeAreaView>
  )
}
