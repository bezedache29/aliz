import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUpdateRecipe } from '@/src/apis/backendApi/hooks/recipes/useUpdateRecipe'
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

const existingRecipe: Recipe = {
  id: 'recipe-1',
  name: 'Soupe de tomates',
  category: 'Soupe',
  ingredients: [],
  steps: [],
  isFavorite: false,
}

describe('useUpdateRecipe (mock mode)', () => {
  it('returns the updated recipe', async () => {
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const updated = { ...existingRecipe, name: 'Soupe de tomates et basilic' }
    const mutatePromise = result.current.mutateAsync(updated)
    await act(async () => {
      await jest.runAllTimersAsync()
    })

    const returned = await mutatePromise
    expect(returned.id).toBe('recipe-1')
    expect(returned.name).toBe('Soupe de tomates et basilic')
  })

  it('updates the recipe in the query cache', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [existingRecipe])

    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const updated = { ...existingRecipe, name: 'Modifié', isFavorite: true }
    const mutatePromise = result.current.mutateAsync(updated)
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![0].name).toBe('Modifié')
    expect(cached![0].isFavorite).toBe(true)
  })

  it('does not affect other recipes in the cache', async () => {
    const other: Recipe = { ...existingRecipe, id: 'recipe-2', name: 'Autre recette' }
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [existingRecipe, other])

    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync({ ...existingRecipe, name: 'Modifié' })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![1].name).toBe('Autre recette')
  })
})
