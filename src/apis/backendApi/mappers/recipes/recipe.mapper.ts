import type {
  CreateRecipeDTO,
  RecipeDTO,
  RecipeIngredientDTO,
  UpdateRecipeDTO,
} from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import type {
  Recipe,
  RecipeCategory,
  RecipeCookingMethod,
  RecipeIngredient,
  RecipeSeason,
} from '@/src/models/recipe/recipe.model'

function ingredientDTOtoIngredient(dto: RecipeIngredientDTO): RecipeIngredient {
  return {
    food: {
      id: dto.foodId,
      name: dto.foodName,
      source: dto.foodSource,
      brand: dto.foodBrand,
      barcode: dto.foodBarcode,
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

function ingredientToDTO(ingredient: RecipeIngredient): RecipeIngredientDTO {
  return {
    foodId: ingredient.food.id,
    foodName: ingredient.food.name,
    foodSource: ingredient.food.source,
    foodBrand: ingredient.food.brand,
    foodBarcode: ingredient.food.barcode,
    per100gKcal: ingredient.food.per100g.kcal,
    per100gProteines: ingredient.food.per100g.proteines,
    per100gGlucides: ingredient.food.per100g.glucides,
    per100gLipides: ingredient.food.per100g.lipides,
    per100gFibres: ingredient.food.per100g.fibres ?? 0,
    per100gSel: ingredient.food.per100g.sel ?? 0,
    quantityG: ingredient.quantityG,
  }
}

export function recipeDTOtoRecipe(dto: RecipeDTO): Recipe {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category as RecipeCategory,
    ingredients: dto.ingredients.map(ingredientDTOtoIngredient),
    steps: dto.steps ?? [],
    isFavorite: dto.isFavorite,
    isAiGenerated: dto.isAiGenerated,
    prepTime: dto.prepTime,
    cookTime: dto.cookTime,
    servings: dto.servings,
    seasons: dto.seasons as RecipeSeason[] | undefined,
    cookingMethod: dto.cookingMethod as RecipeCookingMethod | undefined,
  }
}

export function recipeToCreateDTO(recipe: Omit<Recipe, 'id' | 'isFavorite'>): CreateRecipeDTO {
  return {
    name: recipe.name,
    category: recipe.category,
    ingredients: recipe.ingredients.map(ingredientToDTO),
    steps: recipe.steps,
    isAiGenerated: recipe.isAiGenerated,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    seasons: recipe.seasons,
    cookingMethod: recipe.cookingMethod,
  }
}

export function recipeToUpdateDTO(patch: Partial<Recipe>): UpdateRecipeDTO {
  const dto: UpdateRecipeDTO = {}
  if (patch.name !== undefined) dto.name = patch.name
  if (patch.category !== undefined) dto.category = patch.category
  if (patch.ingredients !== undefined) dto.ingredients = patch.ingredients.map(ingredientToDTO)
  if (patch.steps !== undefined) dto.steps = patch.steps
  if (patch.isFavorite !== undefined) dto.isFavorite = patch.isFavorite
  if (patch.prepTime !== undefined) dto.prepTime = patch.prepTime
  if (patch.cookTime !== undefined) dto.cookTime = patch.cookTime
  if (patch.servings !== undefined) dto.servings = patch.servings
  if (patch.seasons !== undefined) dto.seasons = patch.seasons
  if (patch.cookingMethod !== undefined) dto.cookingMethod = patch.cookingMethod
  return dto
}
