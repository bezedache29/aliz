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

function asSeasons(values: string[] | undefined): RecipeSeason[] {
  return (values ?? []).filter((v) => (RECIPE_SEASONS as string[]).includes(v)) as RecipeSeason[]
}

// Le LLM ne garantit pas la présence de chaque champ numérique pour chaque ingrédient
// (LlmService ne valide que la présence globale de "ingredients", pas ses sous-champs) —
// alors que ces champs sont requis côté backend pour enregistrer la recette. On sécurise
// donc chaque valeur ici plutôt que de laisser passer `undefined` jusqu'à la requête.
function asNumber(value: number | undefined): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
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
        kcal: asNumber(dto.per100gKcal),
        proteines: asNumber(dto.per100gProteines),
        glucides: asNumber(dto.per100gGlucides),
        lipides: asNumber(dto.per100gLipides),
        fibres: asNumber(dto.per100gFibres),
        sel: asNumber(dto.per100gSel),
      },
    },
    quantityG: asNumber(dto.quantityG),
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
