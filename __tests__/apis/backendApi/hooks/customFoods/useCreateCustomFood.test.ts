import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateCustomFood } from '@/src/apis/backendApi/hooks/customFoods/useCreateCustomFood'
import type { CustomFoodDTO } from '@/src/apis/backendApi/dto/customFoods/customFood.dto'
import type { FoodProduct } from '@/src/models/food/food.model'

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

const newFood = {
  name: 'Gâteau marbré maison',
  barcode: '3123456789012',
  per100g: { kcal: 350, proteines: 5, glucides: 45, lipides: 15 },
}

const createdDTO: CustomFoodDTO = {
  id: 'cf-99',
  name: 'Gâteau marbré maison',
  brand: null,
  barcode: '3123456789012',
  per100gKcal: 350,
  per100gProteines: 5,
  per100gGlucides: 45,
  per100gLipides: 15,
  per100gFibres: null,
  per100gSel: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

describe('useCreateCustomFood', () => {
  it("appelle POST /api/custom-foods et retourne l'aliment créé", async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateCustomFood(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newFood)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/custom-foods',
      expect.objectContaining({
        name: 'Gâteau marbré maison',
        barcode: '3123456789012',
      }),
    )
  })

  it("ajoute l'aliment en tête du cache existant", async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    const existing: FoodProduct = {
      id: 'cf-1',
      name: 'Compote maison',
      source: 'manual',
      per100g: { kcal: 50, proteines: 0, glucides: 12, lipides: 0 },
    }
    queryClient.setQueryData<FoodProduct[]>(['custom-foods'], [existing])

    const { result } = await renderHook(() => useCreateCustomFood(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newFood)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodProduct[]>(['custom-foods'])
    expect(cached).toHaveLength(2)
    expect(cached![0].id).toBe('cf-99')
    expect(cached![1].id).toBe('cf-1')
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateCustomFood(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(newFood)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
