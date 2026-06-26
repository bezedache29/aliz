import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUpdateRecipe } from '@/src/apis/backendApi/hooks/recipes/useUpdateRecipe'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import type { Recipe } from '@/src/models/recipe/recipe.model'

import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { put: jest.fn() },
}))
const mockedPut = backendClient.put as jest.Mock

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

const existingRecipe: Recipe = {
  id: 'recipe-1',
  name: 'Soupe de tomates',
  category: 'Soupe',
  ingredients: [],
  steps: [],
  isFavorite: false,
}

const updatedDTO: RecipeDTO = {
  id: 'recipe-1',
  name: 'Soupe de tomates et basilic',
  category: 'Soupe',
  ingredients: [],
  steps: [],
  isFavorite: false,
}

describe('useUpdateRecipe', () => {
  it('retourne la recette mise à jour', async () => {
    mockedPut.mockResolvedValueOnce({ data: updatedDTO })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    const updated = { ...existingRecipe, name: 'Soupe de tomates et basilic' }
    await act(async () => {
      await result.current.mutateAsync(updated)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('recipe-1')
    expect(result.current.data?.name).toBe('Soupe de tomates et basilic')
  })

  it('met à jour la recette dans le cache', async () => {
    mockedPut.mockResolvedValueOnce({ data: { ...updatedDTO, name: 'Modifié', isFavorite: true } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [existingRecipe])

    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ ...existingRecipe, name: 'Modifié', isFavorite: true })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![0].name).toBe('Modifié')
    expect(cached![0].isFavorite).toBe(true)
  })

  it('ne touche pas aux autres recettes du cache', async () => {
    mockedPut.mockResolvedValueOnce({ data: { ...updatedDTO, name: 'Modifié' } })
    const other: Recipe = { ...existingRecipe, id: 'recipe-2', name: 'Autre recette' }
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [existingRecipe, other])

    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ ...existingRecipe, name: 'Modifié' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached![1].name).toBe('Autre recette')
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPut.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(existingRecipe)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
