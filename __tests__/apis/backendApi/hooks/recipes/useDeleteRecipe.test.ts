import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useDeleteRecipe } from '@/src/apis/backendApi/hooks/recipes/useDeleteRecipe'
import type { Recipe } from '@/src/models/recipe/recipe.model'

import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { delete: jest.fn() },
}))
const mockedDelete = backendClient.delete as jest.Mock

beforeAll(() => {
  notifyManager.setScheduler(queueMicrotask)
})

afterEach(() => {
  jest.clearAllMocks()
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
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

describe('useDeleteRecipe', () => {
  it('retire la recette du cache après suppression', async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1, r2])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('recipe-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('recipe-2')
  })

  it('ne touche pas aux autres recettes', async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1, r2])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('recipe-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![0].name).toBe('Poulet')
  })

  it("gère la suppression d'un id inconnu sans crash", async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [r1])

    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('inexistant')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
  })

  it("passe en état error en cas d'échec", async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeleteRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate('recipe-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
