import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateRecipe } from '@/src/apis/backendApi/hooks/recipes/useCreateRecipe'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import type { Recipe } from '@/src/models/recipe/recipe.model'

import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { post: jest.fn() },
}))
const mockedPost = backendClient.post as jest.Mock

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

const newRecipe: Omit<Recipe, 'id'> = {
  name: 'Soupe de légumes',
  category: 'Soupe',
  ingredients: [],
  steps: ['Faire bouillir', 'Mixer'],
  isFavorite: false,
}

const createdDTO: RecipeDTO = {
  id: 'recipe-99',
  name: 'Soupe de légumes',
  category: 'Soupe',
  ingredients: [],
  steps: ['Faire bouillir', 'Mixer'],
  isFavorite: false,
}

describe('useCreateRecipe', () => {
  it("retourne la recette créée avec l'id backend", async () => {
    mockedPost.mockResolvedValueOnce({ data: createdDTO })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newRecipe)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('recipe-99')
    expect(result.current.data?.name).toBe('Soupe de légumes')
  })

  it('ajoute la recette en tête du cache', async () => {
    mockedPost.mockResolvedValueOnce({ data: createdDTO })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<Recipe[]>(['recipes'], [])

    const { result } = await renderHook(() => useCreateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newRecipe)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<Recipe[]>(['recipes'])
    expect(cached).toHaveLength(1)
    expect(cached![0].name).toBe('Soupe de légumes')
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(newRecipe)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
