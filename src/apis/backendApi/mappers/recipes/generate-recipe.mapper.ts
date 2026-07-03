import type {
  GeneratedRecipeDTO,
  GeneratedRecipeIngredientDTO,
} from '@/src/apis/backendApi/dto/recipes/generate-recipe.dto'
import { MealType } from '@/src/models/planning/planning.model'
import {
  RECIPE_CATEGORIES,
  RECIPE_COOKING_METHODS,
  RECIPE_SEASONS,
  Recipe,
  RecipeCategory,
  RecipeCookingMethod,
  RecipeIngredient,
  RecipeSeason,
} from '@/src/models/recipe/recipe.model'

const MEAL_TYPES: MealType[] = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']

function asCategory(value: string): RecipeCategory {
  return (RECIPE_CATEGORIES as string[]).includes(value)
    ? (value as RecipeCategory)
    : 'Plat principal'
}

function asMeal(value: string | undefined): MealType | undefined {
  return value && (MEAL_TYPES as string[]).includes(value) ? (value as MealType) : undefined
}

function asCookingMethod(value: string | undefined): RecipeCookingMethod | undefined {
  return value && (RECIPE_COOKING_METHODS as string[]).includes(value)
    ? (value as RecipeCookingMethod)
    : undefined
}

function asSeasons(values: string[] | undefined): RecipeSeason[] | undefined {
  return values?.filter((v) => (RECIPE_SEASONS as string[]).includes(v)) as
    | RecipeSeason[]
    | undefined
}

function ingredientDTOtoIngredient(
  dto: GeneratedRecipeIngredientDTO,
  index: number,
): RecipeIngredient {
  return {
    food: {
      id: `ai-${Date.now()}-${index}`,
      name: dto.foodName,
      source: 'manual',
      per100g: {
        kcal: dto.per100gKcal,
        proteines: dto.per100gProteines,
        glucides: dto.per100gGlucides,
        lipides: dto.per100gLipides,
        fibres: dto.per100gFibres,
        sel: dto.per100gSel,
      },
    },
    quantityG: dto.quantityG,
  }
}

export function generatedRecipeDTOtoRecipe(dto: GeneratedRecipeDTO): Omit<Recipe, 'id'> {
  return {
    name: dto.name,
    category: asCategory(dto.category),
    meal: asMeal(dto.meal),
    ingredients: dto.ingredients.map(ingredientDTOtoIngredient),
    steps: dto.steps,
    isFavorite: false,
    isAiGenerated: true,
    prepTime: dto.prepTime,
    cookTime: dto.cookTime,
    seasons: asSeasons(dto.seasons),
    cookingMethod: asCookingMethod(dto.cookingMethod),
  }
}
