import { renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useStravaStatus } from '@/src/apis/backendApi/hooks/strava/useStravaStatus'

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

describe('useStravaStatus', () => {
  it('retourne le statut connecté en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        connected: true,
        athleteName: 'Christophe Salou',
        lastSyncedAt: '2026-07-01T08:00:00Z',
      },
    })
    const { result } = await renderHook(() => useStravaStatus(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.connected).toBe(true)
    expect(result.current.data?.athleteName).toBe('Christophe Salou')
  })

  it('appelle GET /api/strava/status', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { connected: false, athleteName: null, lastSyncedAt: null },
    })
    await renderHook(() => useStravaStatus(), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(mockedGet).toHaveBeenCalledWith('/api/strava/status')
  })

  it('retourne connected=false quand aucun compte n’est lié', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { connected: false, athleteName: null, lastSyncedAt: null },
    })
    const { result } = await renderHook(() => useStravaStatus(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.connected).toBe(false)
  })

  it('passe en état error en cas de réseau KO', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useStravaStatus(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
