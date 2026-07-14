import { renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StravaActivityDTO } from '@/src/apis/backendApi/dto/activity/activity.dto'
import { useActivities } from '@/src/apis/backendApi/hooks/activity/useActivities'

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

const dto: StravaActivityDTO = {
  id: 'a-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: '2026-07-01T08:00:00Z',
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
}

describe('useActivities', () => {
  it('retourne les activités mappées en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [dto] } })
    const { result } = await renderHook(() => useActivities(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('a-1')
    expect(result.current.data![0].name).toBe('Sortie VTT')
  })

  it('appelle GET /api/activities avec limit=30', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    await renderHook(() => useActivities(), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(mockedGet).toHaveBeenCalledWith('/api/activities', { params: { limit: 30 } })
  })

  it('retourne un tableau vide si la réponse est vide', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = await renderHook(() => useActivities(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('passe en état error en cas de réseau KO', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useActivities(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
