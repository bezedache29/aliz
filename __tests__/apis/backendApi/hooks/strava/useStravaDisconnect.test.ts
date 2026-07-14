import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useStravaDisconnect } from '@/src/apis/backendApi/hooks/strava/useStravaDisconnect'

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

describe('useStravaDisconnect', () => {
  it('appelle POST /api/strava/disconnect', async () => {
    mockedPost.mockResolvedValueOnce({ data: { connected: false } })
    const { result } = await renderHook(() => useStravaDisconnect(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    expect(mockedPost).toHaveBeenCalledWith('/api/strava/disconnect')
  })

  it('passe en isSuccess après mutation réussie', async () => {
    mockedPost.mockResolvedValueOnce({ data: { connected: false } })
    const { result } = await renderHook(() => useStravaDisconnect(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("passe en isError en cas d'échec réseau", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useStravaDisconnect(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
