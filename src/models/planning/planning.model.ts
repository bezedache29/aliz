export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner'

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
}

export interface PlannedRecipeSlot {
  meal: MealType
  status: AiSlotStatus
  recipe?: AiRecipeSuggestion
}
