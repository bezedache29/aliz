import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { usePreferences } from '@/src/apis/backendApi/hooks/preference/usePreferences'
import type { FoodPreferenceDTO } from '@/src/apis/backendApi/dto/preference/preference.dto'
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

const likedDTO: FoodPreferenceDTO = { id: 'p-1', foodName: 'Poulet', type: 'liked' }
const dislikedDTO: FoodPreferenceDTO = { id: 'p-2', foodName: 'Foie', type: 'disliked' }

describe('usePreferences', () => {
  it('returns liked and disliked preferences on success', async () => {
    mockedGet.mockResolvedValueOnce({ data: { liked: [likedDTO], disliked: [dislikedDTO] } })
    const { result } = await renderHook(() => usePreferences(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.liked).toHaveLength(1)
    expect(result.current.data!.liked[0].foodName).toBe('Poulet')
    expect(result.current.data!.liked[0].id).toBe('p-1')
    expect(result.current.data!.disliked).toHaveLength(1)
    expect(result.current.data!.disliked[0].foodName).toBe('Foie')
  })

  it('returns empty lists when both arrays are empty', async () => {
    mockedGet.mockResolvedValueOnce({ data: { liked: [], disliked: [] } })
    const { result } = await renderHook(() => usePreferences(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.liked).toEqual([])
    expect(result.current.data!.disliked).toEqual([])
  })

  it('passes into error state on failure', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => usePreferences(), { wrapper: makeWrapper() })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
