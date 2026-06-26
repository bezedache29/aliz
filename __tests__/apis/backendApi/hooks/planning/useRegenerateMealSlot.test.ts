import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'
import type { PlannedRecipeSlot } from '@/src/models/planning/planning.model'

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

const recipeResponse = {
  recipe: {
    id: 'r-42',
    name: 'Salade niçoise',
    kcal: 420,
    proteines: 25,
    glucides: 20,
    lipides: 18,
  },
}

describe('useRegenerateMealSlot', () => {
  it('retourne un slot avec status done après mutation', async () => {
    mockedPost.mockResolvedValueOnce({ data: recipeResponse })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ dateKey: '2026-06-24', mealType: 'Déjeuner' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.meal).toBe('Déjeuner')
    expect(result.current.data?.status).toBe('done')
  })

  it('met à jour le cache planning pour le bon créneau', async () => {
    mockedPost.mockResolvedValueOnce({ data: recipeResponse })
    const queryClient = makeQueryClient()

    const existing: PlannedRecipeSlot[] = [
      {
        meal: 'Déjeuner',
        status: 'done',
        recipe: { id: 'r-1', name: 'Ancien', kcal: 300, proteines: 15, glucides: 25, lipides: 10 },
      },
      {
        meal: 'Dîner',
        status: 'done',
        recipe: {
          id: 'r-2',
          name: 'Dîner stable',
          kcal: 500,
          proteines: 30,
          glucides: 40,
          lipides: 20,
        },
      },
    ]
    queryClient.setQueryData(['planning', 'week', '2026-06-24'], existing)

    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ dateKey: '2026-06-24', mealType: 'Déjeuner' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<PlannedRecipeSlot[]>(['planning', 'week', '2026-06-24'])
    expect(cached![0].recipe?.name).toBe('Salade niçoise')
    expect(cached![1].recipe?.name).toBe('Dîner stable')
  })

  it("accepte un prompt optionnel et l'envoie au backend", async () => {
    mockedPost.mockResolvedValueOnce({ data: recipeResponse })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        dateKey: '2026-06-24',
        mealType: 'Dîner',
        prompt: 'sans viande',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('Dîner/regenerate'), {
      prompt: 'sans viande',
    })
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ dateKey: '2026-06-24', mealType: 'Déjeuner' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
