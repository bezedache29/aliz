import { createStore } from 'jotai'

import dayjs from '@/src/config/dayjs'
import type { PlannedMeal } from '@/src/models/planning/planning.model'
import { selectedDateAtom, weekPlanAtom } from '@/src/store/planningAtom'

const mockMeal: PlannedMeal = {
  id: '1',
  name: 'Omelette aux légumes',
  kcal: 456,
  proteines: 32,
  glucides: 12,
  lipides: 28,
  meal: 'Petit-déjeuner',
}

describe('selectedDateAtom', () => {
  it('initialise sur le jour courant', () => {
    const store = createStore()
    const value = store.get(selectedDateAtom)
    expect(value.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'))
  })

  it('se met à jour avec une nouvelle date', () => {
    const store = createStore()
    const newDate = dayjs('2026-01-15')
    store.set(selectedDateAtom, newDate)
    expect(store.get(selectedDateAtom).format('YYYY-MM-DD')).toBe('2026-01-15')
  })
})

describe('weekPlanAtom — journal des repas consommés', () => {
  it('initialise avec un objet vide', () => {
    const store = createStore()
    expect(store.get(weekPlanAtom)).toEqual({})
  })

  it('stocke des repas planifiés pour une clé de date', () => {
    const store = createStore()
    store.set(weekPlanAtom, { '2026-01-15': [mockMeal] })
    expect(store.get(weekPlanAtom)['2026-01-15']).toHaveLength(1)
    expect(store.get(weekPlanAtom)['2026-01-15'][0].name).toBe('Omelette aux légumes')
  })

  it('supporte plusieurs dates indépendantes', () => {
    const store = createStore()
    const meal2: PlannedMeal = { ...mockMeal, id: '2', meal: 'Déjeuner' }
    store.set(weekPlanAtom, {
      '2026-01-15': [mockMeal],
      '2026-01-16': [meal2],
    })
    expect(store.get(weekPlanAtom)['2026-01-15']).toHaveLength(1)
    expect(store.get(weekPlanAtom)['2026-01-16'][0].meal).toBe('Déjeuner')
  })

  it('retourne undefined pour une date sans repas planifié', () => {
    const store = createStore()
    expect(store.get(weekPlanAtom)['2099-01-01']).toBeUndefined()
  })
})
