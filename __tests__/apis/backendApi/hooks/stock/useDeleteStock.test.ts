import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useDeleteStock } from '@/src/apis/backendApi/hooks/stock/useDeleteStock'
import type { StockItem } from '@/src/models/stock/stock-item.model'

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

const item1: StockItem = {
  id: 's-1',
  name: 'Pâtes',
  quantity: 500,
  unit: 'g',
  category: 'Sec',
  source: 'manual',
  addedAt: '2026-01-01T00:00:00Z',
}
const item2: StockItem = {
  id: 's-2',
  name: 'Riz',
  quantity: 1000,
  unit: 'g',
  category: 'Sec',
  source: 'manual',
  addedAt: '2026-01-01T00:00:00Z',
}

describe('useDeleteStock', () => {
  it('appelle DELETE /api/stock/:id', async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeleteStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('s-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDelete).toHaveBeenCalledWith('/api/stock/s-1')
  })

  it("retire l'item du cache après suppression", async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<StockItem[]>(['stock'], [item1, item2])

    const { result } = await renderHook(() => useDeleteStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('s-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('s-2')
  })

  it('retourne un tableau vide si le cache était undefined', async () => {
    mockedDelete.mockResolvedValueOnce({ data: {} })
    const queryClient = makeQueryClient()

    const { result } = await renderHook(() => useDeleteStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('s-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<StockItem[]>(['stock'])
    expect(cached).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeleteStock(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate('s-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
