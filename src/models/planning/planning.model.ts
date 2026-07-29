import type { RecipeIngredient } from '@/src/models/recipe/recipe.model'
import type { StockDeduction } from '@/src/models/stock/stock-item.model'

export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner'

// Les suggestions IA (génération hebdo, cartes du Journal) ne concernent que ces deux repas —
// le petit-déjeuner et la collation restent en saisie manuelle uniquement.
export const AI_SUGGESTION_MEAL_TYPES: MealType[] = ['Déjeuner', 'Dîner']

export type JournalEntrySource = 'manual' | 'ai_suggestion'
export type SuggestionStatus = 'accepted' | 'modified'

export interface PlannedMeal {
  id: string
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  meal: MealType
  quantityG?: number
  per100g?: { kcal: number; proteines: number; glucides: number; lipides: number }
  stockDeductions?: StockDeduction[]
  course?: string
  source?: JournalEntrySource
  suggestionStatus?: SuggestionStatus
}

export type AiSlotStatus = 'idle' | 'loading' | 'error' | 'done'

export interface AiRecipeSuggestion {
  id: string
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  prepTime?: number
  cookTime?: number
  description?: string
  steps?: string[]
  ingredients: RecipeIngredient[]
}

export type RecipeCourse = 'Entrée' | 'Plat' | 'Dessert' | ''

export interface PlannedRecipeCourse {
  course: RecipeCourse
  recipe: AiRecipeSuggestion
}

export interface PlannedRecipeSlot {
  date: string
  meal: MealType
  status: AiSlotStatus
  courses: PlannedRecipeCourse[]
}
