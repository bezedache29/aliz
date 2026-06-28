export interface RecipeIngredientDTO {
  foodId: string
  foodName: string
  foodSource: 'openfoodfacts' | 'ciqual' | 'aprifel' | 'manual'
  foodBrand?: string
  foodBarcode?: string
  per100gKcal: number
  per100gProteines: number
  per100gGlucides: number
  per100gLipides: number
  per100gFibres?: number
  per100gSel?: number
  quantityG: number
}

export interface RecipeDTO {
  id: string
  name: string
  category: string
  ingredients: RecipeIngredientDTO[]
  steps?: string[]
  isFavorite: boolean
  prepTime?: number
  cookTime?: number
  servings?: number
  seasons?: string[]
  cookingMethod?: string
}

export interface RecipesListResponseDTO {
  recipes: RecipeDTO[]
}

export type CreateRecipeDTO = Omit<RecipeDTO, 'id' | 'isFavorite'>

export type UpdateRecipeDTO = Partial<Omit<RecipeDTO, 'id'>>
