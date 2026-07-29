import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useRegenerateMealSlot } from '@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot'

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
  courses: [
    {
      course: '',
      recipe: {
        id: 'r-42',
        name: 'Salade niçoise',
        kcal: 420,
        proteines: 25,
        glucides: 20,
        lipides: 18,
        ingredients: [],
      },
    },
  ],
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
    expect(result.current.data?.date).toBe('2026-06-24')
    expect(result.current.data?.meal).toBe('Déjeuner')
    expect(result.current.data?.status).toBe('done')
    expect(result.current.data?.courses[0].recipe.name).toBe('Salade niçoise')
  })

  it('gère un menu à plusieurs plats', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        courses: [
          {
            course: 'Entrée',
            recipe: {
              id: 'r-1',
              name: 'Melon au jambon',
              kcal: 120,
              proteines: 8,
              glucides: 10,
              lipides: 4,
              ingredients: [],
            },
          },
          {
            course: 'Dessert',
            recipe: {
              id: 'r-2',
              name: 'Compote de pommes',
              kcal: 90,
              proteines: 1,
              glucides: 20,
              lipides: 0,
              ingredients: [],
            },
          },
        ],
      },
    })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ dateKey: '2026-06-24', mealType: 'Dîner' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.courses).toHaveLength(2)
    expect(result.current.data?.courses[0].course).toBe('Entrée')
    expect(result.current.data?.courses[1].course).toBe('Dessert')
  })

  it('invalide le cache planning par préfixe (la lecture se fait par semaine, pas par jour)', async () => {
    mockedPost.mockResolvedValueOnce({ data: recipeResponse })
    const queryClient = makeQueryClient()
    // La semaine affichée est mise en cache sous la clé ancrée sur le lundi, pas sur le jour régénéré.
    queryClient.setQueryData(['planning', 'week', '2026-06-22'], [])
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ dateKey: '2026-06-24', mealType: 'Déjeuner' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['planning', 'week'] })
  })

  it('invalide le cache des recettes pour que la nouvelle recette IA soit trouvable', async () => {
    mockedPost.mockResolvedValueOnce({ data: recipeResponse })
    const queryClient = makeQueryClient()
    queryClient.setQueryData(['recipes'], [])
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = await renderHook(() => useRegenerateMealSlot(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ dateKey: '2026-06-24', mealType: 'Déjeuner' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipes'] })
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
