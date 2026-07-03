export interface GenerateRecipeRequestDTO {
  prompt: string
  useStock: boolean
  save: false
}

export interface GeneratedRecipeIngredientDTO {
  foodName: string
  quantityG: number
  per100gKcal: number
  per100gProteines: number
  per100gGlucides: number
  per100gLipides: number
  per100gFibres?: number
  per100gSel?: number
  fromStock: boolean
}

export interface GeneratedRecipeDTO {
  name: string
  description?: string
  category: string
  meal?: string
  cookingMethod?: string
  seasons?: string[]
  prepTime?: number
  cookTime?: number
  kcalEstimated?: number
  proteinesEstimated?: number
  glucidesEstimated?: number
  lipidesEstimated?: number
  steps: string[]
  ingredients: GeneratedRecipeIngredientDTO[]
}
