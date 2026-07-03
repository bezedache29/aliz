import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { backendClient } from '@/src/apis/backendApi/client'
import { useWeightSync } from '@/src/apis/backendApi/hooks/weight/useWeightSync'

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
  newEntry: true,
  weight: 75.5,
  lastSyncedAt: '2026-06-25T07:00:00Z',
}

describe('useWeightSync', () => {
  it('appelle POST /api/weight/sync-renpho', async () => {
    mockedPost.mockResolvedValueOnce({ data: syncResponse })
    const { result } = await renderHook(() => useWeightSync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    expect(mockedPost).toHaveBeenCalledWith('/api/weight/sync-renpho')
  })

  it('passe en isSuccess après mutation réussie', async () => {
    mockedPost.mockResolvedValueOnce({ data: syncResponse })
    const { result } = await renderHook(() => useWeightSync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("passe en isError en cas d'échec réseau", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useWeightSync(), { wrapper: makeWrapper() })
    await act(async () => {
      result.current.mutate()
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
