import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useRecipes } from '@/src/apis/backendApi/hooks/recipes/useRecipes'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'

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

const recipeDTO: RecipeDTO = {
  id: 'recipe-1',
  name: 'Soupe de légumes',
  category: 'Soupe',
  ingredients: [],
  steps: ['Faire bouillir'],
  isFavorite: false,
}

describe('useRecipes', () => {
  it('retourne la liste des recettes mappées', async () => {
    mockedGet.mockResolvedValueOnce({ data: { recipes: [recipeDTO] } })
    const { result } = await renderHook(() => useRecipes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('recipe-1')
    expect(result.current.data![0].name).toBe('Soupe de légumes')
  })

  it('retourne une liste vide si aucune recette', async () => {
    mockedGet.mockResolvedValueOnce({ data: { recipes: [] } })
    const { result } = await renderHook(() => useRecipes(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useRecipes(), { wrapper: makeWrapper() })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
