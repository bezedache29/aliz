import type {
  PlanningCourseDTO,
  PlanningMealSlotDTO,
  PlanningRecipeDTO,
} from '@/src/apis/backendApi/dto/planning/planning.dto'
import {
  planningCourseDTOtoCourse,
  planningRecipeDTOtoSuggestion,
  planningSlotDTOtoSlot,
} from '@/src/apis/backendApi/mappers/planning/planning.mapper'

const ingredientDTO = {
  foodId: 'f1',
  foodName: "Flocons d'avoine",
  foodSource: 'manual' as const,
  per100gKcal: 370,
  per100gProteines: 13,
  per100gGlucides: 60,
  per100gLipides: 7,
  quantityG: 80,
}

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
  steps: ['Faire chauffer le lait', 'Ajouter les flocons et mélanger'],
  ingredients: [ingredientDTO],
}

const courseDTO: PlanningCourseDTO = {
  course: '',
  recipe: recipeDTO,
}

const slotDTO: PlanningMealSlotDTO = {
  date: '2026-06-24',
  mealType: 'Petit-déjeuner',
  courses: [courseDTO],
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
    expect(result.steps).toEqual(['Faire chauffer le lait', 'Ajouter les flocons et mélanger'])
  })

  it('rounds decimal macro values', () => {
    const dto: PlanningRecipeDTO = {
      id: 'x',
      name: 'Test',
      kcal: 380.6,
      proteines: 12.4,
      glucides: 58.5,
      lipides: 9.5,
      ingredients: [],
    }
    const result = planningRecipeDTOtoSuggestion(dto)
    expect(result.kcal).toBe(381)
    expect(result.proteines).toBe(12)
    expect(result.glucides).toBe(59)
    expect(result.lipides).toBe(10)
  })

  it('maps the ingredient list', () => {
    const result = planningRecipeDTOtoSuggestion(recipeDTO)
    expect(result.ingredients).toHaveLength(1)
    expect(result.ingredients[0].food.id).toBe('f1')
    expect(result.ingredients[0].food.name).toBe("Flocons d'avoine")
    expect(result.ingredients[0].quantityG).toBe(80)
  })

  it('maps an empty ingredient list', () => {
    const dto: PlanningRecipeDTO = { ...recipeDTO, ingredients: [] }
    const result = planningRecipeDTOtoSuggestion(dto)
    expect(result.ingredients).toEqual([])
  })

  it('keeps optional fields undefined when absent', () => {
    const dto: PlanningRecipeDTO = {
      id: 'x',
      name: 'Test',
      kcal: 100,
      proteines: 10,
      glucides: 10,
      lipides: 5,
      ingredients: [],
    }
    const result = planningRecipeDTOtoSuggestion(dto)
    expect(result.prepTime).toBeUndefined()
    expect(result.cookTime).toBeUndefined()
    expect(result.description).toBeUndefined()
  })
})

describe('planningCourseDTOtoCourse', () => {
  it('maps the course label and the nested recipe', () => {
    const result = planningCourseDTOtoCourse({ course: 'Entrée', recipe: recipeDTO })
    expect(result.course).toBe('Entrée')
    expect(result.recipe.name).toBe('Porridge aux fruits rouges')
  })

  it('maps an empty course label for a single-dish meal', () => {
    const result = planningCourseDTOtoCourse(courseDTO)
    expect(result.course).toBe('')
  })
})

describe('planningSlotDTOtoSlot', () => {
  it('maps mealType to meal field', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.meal).toBe('Petit-déjeuner')
  })

  it('maps the date field', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.date).toBe('2026-06-24')
  })

  it('sets status to done', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.status).toBe('done')
  })

  it('maps a single-course meal', () => {
    const result = planningSlotDTOtoSlot(slotDTO)
    expect(result.courses).toHaveLength(1)
    expect(result.courses[0].recipe.name).toBe('Porridge aux fruits rouges')
    expect(result.courses[0].recipe.kcal).toBe(380)
  })

  it('maps a multi-course menu', () => {
    const dessertDTO: PlanningRecipeDTO = { ...recipeDTO, id: 'r2', name: 'Compote de pommes' }
    const result = planningSlotDTOtoSlot({
      date: '2026-06-24',
      mealType: 'Dîner',
      courses: [
        { course: 'Plat', recipe: recipeDTO },
        { course: 'Dessert', recipe: dessertDTO },
      ],
    })
    expect(result.courses).toHaveLength(2)
    expect(result.courses[0].course).toBe('Plat')
    expect(result.courses[1].course).toBe('Dessert')
    expect(result.courses[1].recipe.name).toBe('Compote de pommes')
  })
})
