import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useDeleteRecipe } from '@/src/apis/backendApi/hooks/recipes/useDeleteRecipe'
import type { Recipe } from '@/src/models/recipe/recipe.model'

beforeAll(() => {
  notifyManager.setScheduler(queueMicrotask)
})

beforeEach(() => {
  jest.useFakeTimers({ legacyFakeTimers: false })
})

afterEach(() => {
  jest.useRealTimers()
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

const r1: Recipe = {
  id: 'recipe-1',
  name: 'Soupe',
  category: 'Soupe',
  ingredients: [],
  steps: [],
  isFavorite: false,
}
const r2: Recipe = {
  id: 'recipe-2',
  name: 'Poulet',
  category: 'Plat principal',
  ingredients: [],
  steps: [],
  isFavorite: false,
}

describe('useDeleteRecipe (mock mode)', () => {
  it('removes the recipe from the query cache', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1, r2])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync('recipe-1')
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('recipe-2')
  })

  it('does not affect other recipes', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1, r2])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync('recipe-1')
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![0].name).toBe('Poulet')
  })

  it('handles deletion of an unknown id gracefully', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync('inexistant')
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
  })
})
