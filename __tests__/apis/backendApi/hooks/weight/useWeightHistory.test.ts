import { renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useWeightHistory } from '@/src/apis/backendApi/hooks/weight/useWeightHistory'
import type { WeightEntryDTO } from '@/src/apis/backendApi/dto/weight/weight.dto'

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

const dto: WeightEntryDTO = {
  id: 'w-1',
  weight: 75.5,
  bmi: 23.4,
  bodyfat: 18.2,
  water: 55.0,
  muscle: 32.1,
  bone: 3.4,
  bmr: 1800,
  protein: 14.0,
  bodyAge: 38,
  heartRate: 68,
  measuredAt: '2026-06-25T07:00:00',
  createdAt: '2026-06-25T07:00:01Z',
  updatedAt: '2026-06-25T07:00:01Z',
}

describe('useWeightHistory', () => {
  it('retourne les entrées mappées en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [dto] } })
    const { result } = await renderHook(() => useWeightHistory(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('w-1')
    expect(result.current.data![0].measuredAt).toBe('2026-06-25T07:00:00.000Z')
    expect(result.current.data![0].weight).toBe(75.5)
  })

  it('appelle GET /api/weight avec limit=90', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    await renderHook(() => useWeightHistory(), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(mockedGet).toHaveBeenCalledWith('/api/weight', { params: { limit: 90 } })
  })

  it('retourne un tableau vide si la réponse est vide', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = await renderHook(() => useWeightHistory(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('passe en état error en cas de réseau KO', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useWeightHistory(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
