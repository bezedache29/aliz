import { useLocalSearchParams, useRouter } from 'expo-router'
import { ToastAndroid } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useCreateJournalEntry } from '@/src/apis/backendApi/hooks/journal/useCreateJournalEntry'
import { useDeleteStock } from '@/src/apis/backendApi/hooks/stock/useDeleteStock'
import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import { useUpdateStock } from '@/src/apis/backendApi/hooks/stock/useUpdateStock'
import { ScreenHeader } from '@/src/components/screen-header'
import dayjs from '@/src/config/dayjs'
import { AiRecipeGenerator } from '@/src/features/recipes/AiRecipeGenerator'
import { useColors } from '@/src/hooks/use-colors'
import type { MealType, PlannedMeal } from '@/src/models/planning/planning.model'
import { computeRecipeNutrition, type Recipe } from '@/src/models/recipe/recipe.model'
import {
  buildStockDeduction,
  deductStockQuantity,
  findMatchingStockItem,
  type StockDeduction,
} from '@/src/models/stock/stock-item.model'

export default function RecipeGenerateScreen() {
  const c = useColors()
  const router = useRouter()
  const { mealType } = useLocalSearchParams<{ mealType?: string }>()

  const { data: stockItems = [] } = useStock()
  const { mutate: updateStock } = useUpdateStock()
  const { mutate: deleteStock } = useDeleteStock()
  const { mutate: createJournalEntry } = useCreateJournalEntry()
  const todayKey = dayjs().format('YYYY-MM-DD')

  function handleSaved(recipe: Recipe) {
    if (!mealType) {
      router.back()
      return
    }

    const nutrition = computeRecipeNutrition(recipe.ingredients, recipe.servings)

    const stockDeductions: StockDeduction[] = []
    for (const ingredient of recipe.ingredients) {
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

    const meal: Omit<PlannedMeal, 'id'> = {
      name: recipe.name,
      meal: mealType as MealType,
      ...nutrition,
      ...(stockDeductions.length > 0 ? { stockDeductions } : {}),
    }
    createJournalEntry({ meal, dateKey: todayKey })

    if (stockDeductions.length > 0) {
      ToastAndroid.show(
        `Provisions mises à jour (${stockDeductions.length} ingrédient${stockDeductions.length > 1 ? 's' : ''})`,
        ToastAndroid.SHORT,
      )
    }

    router.back()
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScreenHeader title="Générer avec l'IA" subtitle={mealType} />

      <AiRecipeGenerator
        onSaved={handleSaved}
        saveLabel={mealType ? 'Ajouter au repas' : undefined}
      />
    </SafeAreaView>
  )
}
