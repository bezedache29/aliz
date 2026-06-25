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
}

export interface PlanningMealSlotDTO {
  mealType: string
  recipe: PlanningRecipeDTO
}

export interface PlanningWeekResponseDTO {
  meals: PlanningMealSlotDTO[]
}

export interface PlanningRegenerateResponseDTO {
  recipe: PlanningRecipeDTO
}
