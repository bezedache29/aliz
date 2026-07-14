import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useActivitySync } from '@/src/apis/backendApi/hooks/activity/useActivitySync'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { post: jest.fn() },
}))
const mockedPost = backendClient.post as jest.Mock

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
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const syncResponse = {
  newEntries: 1,
  latestActivity: {
    id: 'a-1',
    name: 'Sortie VTT',
    type: 'MountainBikeRide',
    startedAt: '2026-07-01T08:00:00Z',
    distance: 15000.5,
    movingTime: 3600,
    elapsedTime: 3700,
    totalElevationGain: 420,
    calories: 870.2,
  },
}

describe('useActivitySync', () => {
  it('appelle POST /api/activities/sync-strava', async () => {
    mockedPost.mockResolvedValueOnce({ data: syncResponse })
    const { result } = await renderHook(() => useActivitySync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    expect(mockedPost).toHaveBeenCalledWith('/api/activities/sync-strava')
  })

  it('passe en isSuccess après mutation réussie', async () => {
    mockedPost.mockResolvedValueOnce({ data: syncResponse })
    const { result } = await renderHook(() => useActivitySync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("passe en isError en cas d'échec réseau", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useActivitySync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
