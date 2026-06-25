import type {
  PlanningMealSlotDTO,
  PlanningRecipeDTO,
} from '@/src/apis/backendApi/dto/planning/planning.dto'
import {
  planningRecipeDTOtoSuggestion,
  planningSlotDTOtoSlot,
} from '@/src/apis/backendApi/mappers/planning/planning.mapper'

const recipeDTO: PlanningRecipeDTO = {
  id: 'r1',
  name: 'Porridge aux fruits rouges',
  kcal: 380,
  proteines: 12,
  glucides: 58,
  lipides: 10,
  prepTime: 5,
  cookTime: 10,
  description: 'Un porridge léger et nourrissant',
}

const slotDTO: PlanningMealSlotDTO = {
  mealType: 'Petit-déjeuner',
  recipe: recipeDTO,
}

describe('planningRecipeDTOtoSuggestion', () => {
  it('maps all required fields', () => {
    const result = planningRecipeDTOtoSuggestion(recipeDTO)
    expect(result.id).toBe('r1')
    expect(result.name).toBe('Porridge aux fruits rouges')
    expect(result.kcal).toBe(380)
    expect(result.proteines).toBe(12)
    expect(result.glucides).toBe(58)
    expect(result.lipides).toBe(10)
  })

  it('maps optional fields when present', () => {
    const result = planningRecipeDTOtoSuggestion(recipeDTO)
    expect(result.prepTime).toBe(5)
    expect(result.cookTime).toBe(10)
    expect(result.description).toBe('Un porridge léger et nourrissant')
  })

  it('keeps optional fields undefined when absent', () => {
    const dto: PlanningRecipeDTO = {
      id: 'x',
      name: 'Test',
      kcal: 100,
      proteines: 10,
      glucides: 10,
      lipides: 5,
    }
    const result = planningRecipeDTOtoSuggestion(dto)
    expect(result.prepTime).toBeUndefined()
    expect(result.cookTime).toBeUndefined()
    expect(result.description).toBeUndefined()
  })
})

describe('planningSlotDTOtoSlot', () => {
  it('maps mealType to meal field', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.meal).toBe('Petit-déjeuner')
  })

  it('sets status to done', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.status).toBe('done')
  })

  it('maps nested recipe', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.recipe?.name).toBe('Porridge aux fruits rouges')
    expect(result.recipe?.kcal).toBe(380)
  })
})
