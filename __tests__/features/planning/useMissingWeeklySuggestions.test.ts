import { renderHook } from '@testing-library/react-native'

import { useMissingWeeklySuggestions } from '@/src/features/planning/useMissingWeeklySuggestions'
import dayjs from '@/src/config/dayjs'
import type { PlannedRecipeSlot } from '@/src/models/planning/planning.model'

let mockSlots: PlannedRecipeSlot[] = []
let mockIsLoading = false

jest.mock('@/src/apis/backendApi/hooks/planning/usePlanningWeek', () => ({
  usePlanningWeek: () => ({ data: mockSlots, isLoading: mockIsLoading }),
}))

function fullSlot(date: string, meal: PlannedRecipeSlot['meal']): PlannedRecipeSlot {
  return {
    date,
    meal,
    status: 'done',
    courses: [
      {
        course: '',
        recipe: {
          id: 'r1',
          name: 'Recette',
          kcal: 1,
          proteines: 1,
          glucides: 1,
          lipides: 1,
          ingredients: [],
        },
      },
    ],
  }
}

function datesUntilSunday(): string[] {
  const sunday = dayjs().startOf('isoWeek').add(6, 'day')
  const dates: string[] = []
  let cursor = dayjs().startOf('day')
  while (!cursor.isAfter(sunday, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return dates
}

beforeEach(() => {
  mockSlots = []
  mockIsLoading = false
})

describe('useMissingWeeklySuggestions', () => {
  it("retourne 2 créneaux manquants par jour d'ici dimanche (Déjeuner + Dîner) quand rien n'est généré", async () => {
    const dates = datesUntilSunday()
    const { result } = await renderHook(() => useMissingWeeklySuggestions())
    expect(result.current.missingSlots).toHaveLength(dates.length * 2)
  })

  it('ne compte jamais le petit-déjeuner ni la collation', async () => {
    const { result } = await renderHook(() => useMissingWeeklySuggestions())
    expect(result.current.missingSlots.some((s) => s.mealType === 'Petit-déjeuner')).toBe(false)
    expect(result.current.missingSlots.some((s) => s.mealType === 'Collation')).toBe(false)
  })

  it('ne compte pas un créneau déjà généré', async () => {
    const today = dayjs().format('YYYY-MM-DD')
    mockSlots = [fullSlot(today, 'Déjeuner')]
    const { result } = await renderHook(() => useMissingWeeklySuggestions())
    expect(
      result.current.missingSlots.some((s) => s.dateKey === today && s.mealType === 'Déjeuner'),
    ).toBe(false)
    expect(
      result.current.missingSlots.some((s) => s.dateKey === today && s.mealType === 'Dîner'),
    ).toBe(true)
  })

  it('retourne une liste vide pendant le chargement', async () => {
    mockIsLoading = true
    const { result } = await renderHook(() => useMissingWeeklySuggestions())
    expect(result.current.missingSlots).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })
})
