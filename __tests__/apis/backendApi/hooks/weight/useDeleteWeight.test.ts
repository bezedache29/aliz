import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useDeleteWeight } from '@/src/apis/backendApi/hooks/weight/useDeleteWeight'
import type { WeightEntry } from '@/src/models/weight/weight.model'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { delete: jest.fn() },
}))
const mockedDelete = backendClient.delete as jest.Mock

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

const makeEntry = (id: string): WeightEntry => ({
  id,
  measuredAt: '2026-06-25T07:00:00.000Z',
  weight: 75.5,
  bmi: null,
  bodyfat: null,
  water: null,
  muscle: null,
  bone: null,
  bmr: null,
  protein: null,
  bodyAge: null,
  heartRate: null,
})

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return { wrapper: makeWrapperComponent(queryClient), queryClient }
}

function makeWrapperComponent(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useDeleteWeight', () => {
  it('appelle DELETE /api/weight/:id avec le bon id', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const { wrapper } = makeWrapper()
    const { result } = await renderHook(() => useDeleteWeight(), { wrapper })
    await act(async () => {
      result.current.mutate('w-1')
      await jest.runAllTimersAsync()
    })
    expect(mockedDelete).toHaveBeenCalledWith('/api/weight/w-1')
  })

  it('passe en isSuccess après suppression réussie', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const { wrapper } = makeWrapper()
    const { result } = await renderHook(() => useDeleteWeight(), { wrapper })
    await act(async () => {
      result.current.mutate('w-1')
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("retire l'entrée supprimée du cache React Query via onSuccess", async () => {
    mockedDelete.mockResolvedValueOnce({})
    const { wrapper, queryClient } = makeWrapper()

    const { result } = await renderHook(() => useDeleteWeight(), { wrapper })

    // Pré-charge le cache dans le même act pour garantir la cohérence du contexte
    await act(async () => {
      queryClient.setQueryData<WeightEntry[]>(['weight'], [makeEntry('w-1'), makeEntry('w-2')])
      result.current.mutate('w-1')
      await jest.runAllTimersAsync()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Le onSuccess filtre l'entrée supprimée de la liste en cache
    await waitFor(() => {
      const cache = queryClient.getQueryData<WeightEntry[]>(['weight'])
      expect(cache?.find((e) => e.id === 'w-1')).toBeUndefined()
    })
  })

  it("passe en isError en cas d'échec réseau", async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network error'))
    const { wrapper } = makeWrapper()
    const { result } = await renderHook(() => useDeleteWeight(), { wrapper })
    await act(async () => {
      result.current.mutate('w-1')
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
