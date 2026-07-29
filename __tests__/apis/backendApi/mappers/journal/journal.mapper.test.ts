import type { JournalEntryDTO } from '@/src/apis/backendApi/dto/journal/journal.dto'
import {
  journalEntryDTOtoPlannedMeal,
  plannedMealToCreateDTO,
  plannedMealToUpdateDTO,
} from '@/src/apis/backendApi/mappers/journal/journal.mapper'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

const baseDTO: JournalEntryDTO = {
  id: 'j-1',
  date: '2026-01-15',
  mealType: 'Déjeuner',
  course: 'Plat',
  name: 'Poulet rôti',
  kcal: 450,
  proteines: 40,
  glucides: 15,
  lipides: 20,
  quantityG: 300,
  per100gKcal: 150,
  per100gProteines: 13.3,
  per100gGlucides: 5,
  per100gLipides: 6.7,
  stockDeductions: [
    { stockItemId: 's-1', quantityDeducted: 200, itemSnapshot: { name: 'Poulet' } as any },
  ],
  source: 'ai_suggestion',
  suggestionStatus: 'accepted',
  createdAt: '2026-01-15T12:00:00Z',
  updatedAt: '2026-01-15T12:00:00Z',
}

describe('journalEntryDTOtoPlannedMeal', () => {
  it('maps all required fields', () => {
    const result = journalEntryDTOtoPlannedMeal(baseDTO)
    expect(result.id).toBe('j-1')
    expect(result.name).toBe('Poulet rôti')
    expect(result.meal).toBe('Déjeuner')
    expect(result.kcal).toBe(450)
    expect(result.proteines).toBe(40)
    expect(result.glucides).toBe(15)
    expect(result.lipides).toBe(20)
  })

  it('maps quantity, per100g, course, source and suggestion status', () => {
    const result = journalEntryDTOtoPlannedMeal(baseDTO)
    expect(result.quantityG).toBe(300)
    expect(result.per100g).toEqual({ kcal: 150, proteines: 13.3, glucides: 5, lipides: 6.7 })
    expect(result.course).toBe('Plat')
    expect(result.source).toBe('ai_suggestion')
    expect(result.suggestionStatus).toBe('accepted')
  })

  it('maps stock deductions', () => {
    const result = journalEntryDTOtoPlannedMeal(baseDTO)
    expect(result.stockDeductions).toHaveLength(1)
    expect(result.stockDeductions![0].stockItemId).toBe('s-1')
  })

  it('keeps optional fields undefined when the DTO sends null', () => {
    const dto: JournalEntryDTO = {
      ...baseDTO,
      course: null,
      quantityG: null,
      per100gKcal: null,
      stockDeductions: null,
      suggestionStatus: null,
      source: 'manual',
    }
    const result = journalEntryDTOtoPlannedMeal(dto)
    expect(result.course).toBeUndefined()
    expect(result.quantityG).toBeUndefined()
    expect(result.per100g).toBeUndefined()
    expect(result.stockDeductions).toBeUndefined()
    expect(result.suggestionStatus).toBeUndefined()
    expect(result.source).toBe('manual')
  })
})

describe('plannedMealToCreateDTO', () => {
  const meal: Omit<PlannedMeal, 'id'> = {
    name: 'Poulet rôti',
    meal: 'Déjeuner',
    kcal: 450,
    proteines: 40,
    glucides: 15,
    lipides: 20,
    quantityG: 300,
    per100g: { kcal: 150, proteines: 13.3, glucides: 5, lipides: 6.7 },
    course: 'Plat',
    source: 'ai_suggestion',
    suggestionStatus: 'accepted',
  }

  it('maps the date and the meal fields', () => {
    const dto = plannedMealToCreateDTO(meal, '2026-01-15')
    expect(dto.date).toBe('2026-01-15')
    expect(dto.mealType).toBe('Déjeuner')
    expect(dto.course).toBe('Plat')
    expect(dto.name).toBe('Poulet rôti')
    expect(dto.kcal).toBe(450)
  })

  it('maps per100g into flat fields', () => {
    const dto = plannedMealToCreateDTO(meal, '2026-01-15')
    expect(dto.per100gKcal).toBe(150)
    expect(dto.per100gProteines).toBe(13.3)
  })

  it('defaults source to manual when absent', () => {
    const manualMeal: Omit<PlannedMeal, 'id'> = {
      name: 'Pomme',
      meal: 'Collation',
      kcal: 80,
      proteines: 0,
      glucides: 20,
      lipides: 0,
    }
    const dto = plannedMealToCreateDTO(manualMeal, '2026-01-15')
    expect(dto.source).toBe('manual')
    expect(dto.course).toBeNull()
    expect(dto.quantityG).toBeNull()
    expect(dto.per100gKcal).toBeNull()
    expect(dto.suggestionStatus).toBeNull()
  })
})

describe('plannedMealToUpdateDTO', () => {
  it('produces the same payload as create, for a full meal', () => {
    const meal: PlannedMeal = {
      id: 'j-1',
      name: 'Poulet rôti',
      meal: 'Déjeuner',
      kcal: 450,
      proteines: 40,
      glucides: 15,
      lipides: 20,
      quantityG: 300,
    }
    const dto = plannedMealToUpdateDTO(meal, '2026-01-15')
    expect(dto.date).toBe('2026-01-15')
    expect(dto.name).toBe('Poulet rôti')
    expect(dto.quantityG).toBe(300)
  })
})
