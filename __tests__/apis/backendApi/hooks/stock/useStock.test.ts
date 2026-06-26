import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useStock } from '@/src/apis/backendApi/hooks/stock/useStock'
import type { StockItemDTO } from '@/src/apis/backendApi/dto/stock/stock.dto'

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

const stockDTO: StockItemDTO = {
  id: 's-1',
  foodName: 'Riz basmati',
  foodId: null,
  foodSource: 'manual',
  foodBrand: null,
  foodBarcode: null,
  per100gKcal: 350,
  per100gProteines: 7,
  per100gGlucides: 77,
  per100gLipides: 0.5,
  quantityG: 500,
  expiryDate: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useStock', () => {
  it('retourne la liste des items mappés en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [stockDTO] } })
    const { result } = await renderHook(() => useStock(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('s-1')
    expect(result.current.data![0].name).toBe('Riz basmati')
    expect(result.current.data![0].unit).toBe('g')
    expect(result.current.data![0].category).toBe('Sec')
  })

  it('retourne une liste vide si le stock est vide', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = await renderHook(() => useStock(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useStock(), { wrapper: makeWrapper() })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
