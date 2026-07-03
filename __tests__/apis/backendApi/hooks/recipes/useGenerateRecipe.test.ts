import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useGenerateRecipe } from '@/src/apis/backendApi/hooks/recipes/useGenerateRecipe'
import type { GeneratedRecipeDTO } from '@/src/apis/backendApi/dto/recipes/generate-recipe.dto'

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

const generatedDTO: GeneratedRecipeDTO = {
  name: 'Curry de légumes',
  category: 'Plat principal',
  steps: ['Faire revenir les légumes', 'Ajouter le lait de coco'],
  ingredients: [
    {
      foodName: 'Lait de coco',
      quantityG: 200,
      per100gKcal: 230,
      per100gProteines: 2.3,
      per100gGlucides: 6,
      per100gLipides: 24,
      fromStock: false,
    },
  ],
}

describe('useGenerateRecipe', () => {
  it('retourne la recette générée mappée', async () => {
    mockedPost.mockResolvedValueOnce({ data: generatedDTO })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useGenerateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ prompt: 'Un curry sans viande', useStock: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Curry de légumes')
    expect(result.current.data?.ingredients).toHaveLength(1)
  })

  it('envoie prompt, useStock et save=false au backend', async () => {
    mockedPost.mockResolvedValueOnce({ data: generatedDTO })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useGenerateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ prompt: 'Un curry sans viande', useStock: true })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith('/api/recipes/generate', {
      prompt: 'Un curry sans viande',
      useStock: true,
      save: false,
    })
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useGenerateRecipe(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ prompt: 'Un plat', useStock: false })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
