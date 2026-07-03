import { FoodProduct } from '@/src/models/food/food.model'
import { MealType } from '@/src/models/planning/planning.model'

export type RecipeCategory =
  | 'Petit-déjeuner'
  | 'Brunch'
  | 'Entrée'
  | 'Plat principal'
  | 'Soupe'
  | 'Dessert'
  | 'Encas'
  | 'Apéritif'
  | 'Boulangerie'
  | 'Sauce & condiments'

export type RecipeSeason = 'Printemps' | 'Été' | 'Automne' | 'Hiver'
export type RecipeCookingMethod = 'Four' | 'Poêle' | 'Cookeo' | 'Barbecue' | 'Froid'

export const RECIPE_SEASONS: RecipeSeason[] = ['Printemps', 'Été', 'Automne', 'Hiver']
export const RECIPE_COOKING_METHODS: RecipeCookingMethod[] = [
  'Four',
  'Poêle',
  'Cookeo',
  'Barbecue',
  'Froid',
]

export interface RecipeIngredient {
  food: FoodProduct
  quantityG: number
  unitCount?: number
  unitWeightG?: number
  displayUnit?: string
}

export interface Recipe {
  id: string
  name: string
  category: RecipeCategory
  meal?: MealType
  ingredients: RecipeIngredient[]
  steps: string[]
  isFavorite?: boolean
  isAiGenerated?: boolean
  prepTime?: number
  cookTime?: number
  servings?: number
  seasons?: RecipeSeason[]
  cookingMethod?: RecipeCookingMethod
}

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  'Petit-déjeuner',
  'Brunch',
  'Entrée',
  'Plat principal',
  'Soupe',
  'Dessert',
  'Encas',
  'Apéritif',
  'Boulangerie',
  'Sauce & condiments',
]

export function computeRecipeNutrition(ingredients: RecipeIngredient[], servings = 1) {
  const s = Math.max(1, servings)
  const valid = ingredients.filter((i) => i.food?.per100g)
  return {
    kcal: Math.round(
      valid.reduce((acc, i) => acc + (i.food.per100g.kcal * i.quantityG) / 100, 0) / s,
    ),
    proteines:
      Math.round(
        (valid.reduce((acc, i) => acc + (i.food.per100g.proteines * i.quantityG) / 100, 0) / s) *
          10,
      ) / 10,
    glucides:
      Math.round(
        (valid.reduce((acc, i) => acc + (i.food.per100g.glucides * i.quantityG) / 100, 0) / s) * 10,
      ) / 10,
    lipides:
      Math.round(
        (valid.reduce((acc, i) => acc + (i.food.per100g.lipides * i.quantityG) / 100, 0) / s) * 10,
      ) / 10,
  }
}
