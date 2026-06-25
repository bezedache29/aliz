import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useRecipes } from '@/src/apis/backendApi/hooks/recipes/useRecipes'
import type { Recipe } from '@/src/models/recipe/recipe.model'

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

describe('useRecipes (mock mode)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('returns a non-empty list of recipes after loading', async () => {
    const { result } = await renderHook(() => useRecipes(), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.data).toBeDefined()
    expect(result.current.data!.length).toBeGreaterThan(0)
  })

  it('each recipe has required fields', async () => {
    const { result } = await renderHook(() => useRecipes(), {
      wrapper: makeWrapper(queryClient),
    })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    result.current.data!.forEach((recipe: Recipe) => {
      expect(recipe.id).toBeDefined()
      expect(recipe.name).toBeDefined()
      expect(recipe.category).toBeDefined()
      expect(Array.isArray(recipe.ingredients)).toBe(true)
      expect(Array.isArray(recipe.steps)).toBe(true)
    })
  })
})
