import { act, renderHook } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateRecipe } from '@/src/apis/backendApi/hooks/recipes/useCreateRecipe'
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

const newRecipe: Omit<Recipe, 'id'> = {
  name: 'Soupe de légumes',
  category: 'Soupe',
  ingredients: [],
  steps: ['Faire bouillir', 'Mixer'],
  isFavorite: false,
}

describe('useCreateRecipe (mock mode)', () => {
  it('returns the created recipe with a generated id', async () => {
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync(newRecipe)
    await act(async () => {
      await jest.runAllTimersAsync()
    })

    const created = await mutatePromise
    expect(created.id).toBeDefined()
    expect(created.name).toBe('Soupe de légumes')
    expect(created.category).toBe('Soupe')
  })

  it('updates the recipes query cache after creation', async () => {
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [])

    const { result } = await renderHook(() => useCreateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const mutatePromise = result.current.mutateAsync(newRecipe)
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await act(async () => {
      await mutatePromise
    })

    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
    expect(cached![0].name).toBe('Soupe de légumes')
  })
})
