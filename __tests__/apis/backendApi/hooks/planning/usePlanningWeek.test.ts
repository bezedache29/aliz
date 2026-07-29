import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'
import type { PlanningWeekResponseDTO } from '@/src/apis/backendApi/dto/planning/planning.dto'

import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { get: jest.fn() },
}))
const mockedGet = backendClient.get as jest.Mock

beforeAll(() => {
  notifyManager.setScheduler(queueMicrotask)
})

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  jest.clearAllMocks()
})

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockRecipe = {
  id: 'r-1',
  name: 'Salade',
  kcal: 350,
  proteines: 20,
  glucides: 30,
  lipides: 10,
  ingredients: [],
}

const planningResponse: PlanningWeekResponseDTO = {
  meals: [
    {
      date: '2026-06-24',
      mealType: 'Petit-déjeuner',
      courses: [{ course: '', recipe: mockRecipe }],
    },
    { date: '2026-06-24', mealType: 'Déjeuner', courses: [{ course: '', recipe: mockRecipe }] },
    { date: '2026-06-24', mealType: 'Collation', courses: [{ course: '', recipe: mockRecipe }] },
    { date: '2026-06-24', mealType: 'Dîner', courses: [{ course: '', recipe: mockRecipe }] },
  ],
}

describe('usePlanningWeek', () => {
  it('retourne 4 slots après chargement', async () => {
    mockedGet.mockResolvedValueOnce({ data: planningResponse })
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(4)
  })

  it('couvre les 4 types de repas', async () => {
    mockedGet.mockResolvedValueOnce({ data: planningResponse })
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const mealTypes = result.current.data!.map((s) => s.meal)
    expect(mealTypes).toContain('Petit-déjeuner')
    expect(mealTypes).toContain('Déjeuner')
    expect(mealTypes).toContain('Collation')
    expect(mealTypes).toContain('Dîner')
  })

  it('reporte la date de chaque créneau', async () => {
    mockedGet.mockResolvedValueOnce({ data: planningResponse })
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.every((s) => s.date === '2026-06-24')).toBe(true)
  })

  it('retourne une liste vide si aucun repas', async () => {
    mockedGet.mockResolvedValueOnce({ data: { meals: [] } })
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(),
    })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
