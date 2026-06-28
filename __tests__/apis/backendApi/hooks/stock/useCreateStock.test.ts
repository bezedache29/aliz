import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateStock } from '@/src/apis/backendApi/hooks/stock/useCreateStock'
import type { StockItemDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'
import type { StockItem } from '@/src/models/stock/stock-item.model'

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

const newItem: Omit<StockItem, 'id' | 'addedAt'> = {
  name: 'Pâtes',
  quantity: 500,
  unit: 'g',
  category: 'Sec',
  source: 'manual',
}

const createdDTO: StockItemDTO = {
  id: 's-99',
  foodName: 'Pâtes',
  foodId: null,
  foodSource: 'manual',
  foodBrand: null,
  foodBarcode: null,
  per100gKcal: null,
  per100gProteines: null,
  per100gGlucides: null,
  per100gLipides: null,
  quantityG: 500,
  unit: 'g',
  category: 'Sec',
  state: null,
  expiryDate: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

describe('useCreateStock', () => {
  it("appelle POST /api/stock et retourne l'item créé", async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newItem)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/stock',
      expect.objectContaining({
        foodName: 'Pâtes',
        quantityG: 500,
      }),
    )
  })

  it('préserve unit/category/state dans le cache via variables', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<StockItem[]>(['stock'], [])

    const { result } = await renderHook(() => useCreateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    const itemWithState: Omit<StockItem, 'id' | 'addedAt'> = {
      ...newItem,
      unit: 'kg',
      category: 'Frais',
      state: 'cru',
    }

    await act(async () => {
      await result.current.mutateAsync(itemWithState)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toHaveLength(1)
    expect(cached![0].unit).toBe('kg')
    expect(cached![0].category).toBe('Frais')
    expect(cached![0].state).toBe('cru')
    expect(cached![0].id).toBe('s-99')
  })

  it("ajoute l'item en tête du cache existant", async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    const existing: StockItem = {
      id: 's-1',
      name: 'Riz',
      quantity: 1000,
      unit: 'g',
      category: 'Sec',
      source: 'manual',
      addedAt: '2026-01-01T00:00:00Z',
    }
    queryClient.setQueryData<StockItem[]>(['stock'], [existing])

    const { result } = await renderHook(() => useCreateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(newItem)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toHaveLength(2)
    expect(cached![0].id).toBe('s-99')
    expect(cached![1].id).toBe('s-1')
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(newItem)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
