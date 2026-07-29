import { ingredientDTOtoIngredient } from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import type {
  PlanningCourseDTO,
  PlanningMealSlotDTO,
  PlanningRecipeDTO,
} from '@/src/apis/backendApi/dto/planning/planning.dto'
import type {
  AiRecipeSuggestion,
  MealType,
  PlannedRecipeCourse,
  PlannedRecipeSlot,
  RecipeCourse,
} from '@/src/models/planning/planning.model'

export function planningRecipeDTOtoSuggestion(dto: PlanningRecipeDTO): AiRecipeSuggestion {
  return {
    id: dto.id,
    name: dto.name,
    kcal: Math.round(dto.kcal),
    proteines: Math.round(dto.proteines),
    glucides: Math.round(dto.glucides),
    lipides: Math.round(dto.lipides),
    prepTime: dto.prepTime,
    cookTime: dto.cookTime,
    description: dto.description,
    steps: dto.steps,
    ingredients: dto.ingredients.map(ingredientDTOtoIngredient),
  }
}

export function planningCourseDTOtoCourse(dto: PlanningCourseDTO): PlannedRecipeCourse {
  return {
    course: dto.course as RecipeCourse,
    recipe: planningRecipeDTOtoSuggestion(dto.recipe),
  }
}

export function planningSlotDTOtoSlot(dto: PlanningMealSlotDTO): PlannedRecipeSlot {
  return {
    date: dto.date,
    meal: dto.mealType as MealType,
    status: 'done',
    courses: dto.courses.map(planningCourseDTOtoCourse),
  }
}
