import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { usePlanningWeek } from '@/src/apis/backendApi/hooks/planning/usePlanningWeek'

beforeAll(() => {
  notifyManager.setScheduler(queueMicrotask)
})

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('usePlanningWeek (mock mode)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('returns 4 slots after loading', async () => {
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.data).toHaveLength(4)
  })

  it('all slots have status done', async () => {
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    result.current.data!.forEach((slot) => {
      expect(slot.status).toBe('done')
    })
  })

  it('covers all 4 meal types', async () => {
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    const mealTypes = result.current.data!.map((s) => s.meal)
    expect(mealTypes).toContain('Petit-déjeuner')
    expect(mealTypes).toContain('Déjeuner')
    expect(mealTypes).toContain('Collation')
    expect(mealTypes).toContain('Dîner')
  })

  it('each slot has a recipe with valid macros', async () => {
    const { result } = await renderHook(() => usePlanningWeek('2026-06-24'), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    result.current.data!.forEach((slot) => {
      expect(slot.recipe).toBeDefined()
      expect(slot.recipe!.kcal).toBeGreaterThan(0)
      expect(slot.recipe!.proteines).toBeGreaterThanOrEqual(0)
      expect(slot.recipe!.glucides).toBeGreaterThanOrEqual(0)
      expect(slot.recipe!.lipides).toBeGreaterThanOrEqual(0)
    })
  })
})
