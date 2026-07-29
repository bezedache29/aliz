import type {
  CreateJournalEntryDTO,
  JournalEntryDTO,
  UpdateJournalEntryDTO,
} from '@/src/apis/backendApi/dto/journal/journal.dto'
import type { MealType, PlannedMeal } from '@/src/models/planning/planning.model'

export function journalEntryDTOtoPlannedMeal(dto: JournalEntryDTO): PlannedMeal {
  return {
    id: dto.id,
    name: dto.name,
    kcal: dto.kcal,
    proteines: dto.proteines,
    glucides: dto.glucides,
    lipides: dto.lipides,
    meal: dto.mealType as MealType,
    quantityG: dto.quantityG ?? undefined,
    per100g:
      dto.per100gKcal != null
        ? {
            kcal: dto.per100gKcal,
            proteines: dto.per100gProteines ?? 0,
            glucides: dto.per100gGlucides ?? 0,
            lipides: dto.per100gLipides ?? 0,
          }
        : undefined,
    stockDeductions: dto.stockDeductions ?? undefined,
    course: dto.course ?? undefined,
    source: dto.source,
    suggestionStatus: dto.suggestionStatus ?? undefined,
  }
}

export function plannedMealToCreateDTO(
  meal: Omit<PlannedMeal, 'id'>,
  date: string,
): CreateJournalEntryDTO {
  return {
    date,
    mealType: meal.meal,
    course: meal.course ?? null,
    name: meal.name,
    kcal: meal.kcal,
    proteines: meal.proteines,
    glucides: meal.glucides,
    lipides: meal.lipides,
    quantityG: meal.quantityG ?? null,
    per100gKcal: meal.per100g?.kcal ?? null,
    per100gProteines: meal.per100g?.proteines ?? null,
    per100gGlucides: meal.per100g?.glucides ?? null,
    per100gLipides: meal.per100g?.lipides ?? null,
    stockDeductions: meal.stockDeductions ?? null,
    source: meal.source ?? 'manual',
    suggestionStatus: meal.suggestionStatus ?? null,
  }
}

export function plannedMealToUpdateDTO(meal: PlannedMeal, date: string): UpdateJournalEntryDTO {
  return plannedMealToCreateDTO(meal, date)
}
