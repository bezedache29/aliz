import type {
  PlanningMealSlotDTO,
  PlanningRecipeDTO,
} from '@/src/apis/backendApi/dto/planning/planning.dto'
import type {
  AiRecipeSuggestion,
  MealType,
  PlannedRecipeSlot,
} from '@/src/models/planning/planning.model'

export function planningRecipeDTOtoSuggestion(dto: PlanningRecipeDTO): AiRecipeSuggestion {
  return {
    id: dto.id,
    name: dto.name,
    kcal: dto.kcal,
    proteines: dto.proteines,
    glucides: dto.glucides,
    lipides: dto.lipides,
    prepTime: dto.prepTime,
    cookTime: dto.cookTime,
    description: dto.description,
  }
}

export function planningSlotDTOtoSlot(dto: PlanningMealSlotDTO): PlannedRecipeSlot {
  return {
    meal: dto.mealType as MealType,
    status: 'done',
    recipe: planningRecipeDTOtoSuggestion(dto.recipe),
  }
}
