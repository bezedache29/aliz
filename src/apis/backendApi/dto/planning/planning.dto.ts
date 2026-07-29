import type { RecipeIngredientDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'

export interface PlanningRecipeDTO {
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
  ingredients: RecipeIngredientDTO[]
}

export interface PlanningCourseDTO {
  course: string
  recipe: PlanningRecipeDTO
}

export interface PlanningMealSlotDTO {
  date: string
  mealType: string
  courses: PlanningCourseDTO[]
}

export interface PlanningWeekResponseDTO {
  meals: PlanningMealSlotDTO[]
}

export interface PlanningRegenerateResponseDTO {
  courses: PlanningCourseDTO[]
}
