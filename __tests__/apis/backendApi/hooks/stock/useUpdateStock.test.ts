import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUpdateStock } from '@/src/apis/backendApi/hooks/stock/useUpdateStock'
import type { StockItem } from '@/src/models/stock/stock-item.model'

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

const existingItem: StockItem = {
  id: 's-1',
  name: 'Pâtes',
  quantity: 500,
  unit: 'g',
  category: 'Sec',
  source: 'manual',
  addedAt: '2026-01-01T00:00:00Z',
}

describe('useUpdateStock', () => {
  it('appelle PUT /api/stock/:id', async () => {
    mockedPut.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync(existingItem)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPut).toHaveBeenCalledWith(
      '/api/stock/s-1',
      expect.objectContaining({
        foodName: 'Pâtes',
        quantityG: 500,
      }),
    )
  })

  it("met à jour l'item dans le cache en préservant les variables", async () => {
    mockedPut.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<StockItem[]>(['stock'], [existingItem])

    const { result } = await renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    const updated: StockItem = {
      ...existingItem,
      quantity: 250,
      unit: 'kg',
      category: 'Frais',
    }

    await act(async () => {
      await result.current.mutateAsync(updated)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toHaveLength(1)
    expect(cached![0].quantity).toBe(250)
    expect(cached![0].unit).toBe('kg')
    expect(cached![0].category).toBe('Frais')
  })

  it('ne touche pas aux autres items du cache', async () => {
    mockedPut.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    const other: StockItem = {
      id: 's-2',
      name: 'Riz',
      quantity: 1000,
      unit: 'g',
      category: 'Sec',
      source: 'manual',
      addedAt: '2026-01-01T00:00:00Z',
    }
    queryClient.setQueryData<StockItem[]>(['stock'], [existingItem, other])

    const { result } = await renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ ...existingItem, quantity: 100 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toHaveLength(2)
    expect(cached![1].id).toBe('s-2')
    expect(cached![1].quantity).toBe(1000)
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPut.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate(existingItem)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
