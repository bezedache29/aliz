import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useDeletePreference } from '@/src/apis/backendApi/hooks/preference/useDeletePreference'
import type { FoodPreference, FoodPreferences } from '@/src/models/preference/food-preference.model'
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

const likedPoulet: FoodPreference = { id: 'p-1', foodName: 'Poulet', type: 'liked' }
const likedBrocoli: FoodPreference = { id: 'p-2', foodName: 'Brocoli', type: 'liked' }
const dislikedFoie: FoodPreference = { id: 'p-3', foodName: 'Foie', type: 'disliked' }

describe('useDeletePreference', () => {
  it('calls DELETE /api/preferences/:id', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeletePreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('p-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDelete).toHaveBeenCalledWith('/api/preferences/p-1')
  })

  it('removes preference from liked list in cache', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [likedPoulet, likedBrocoli],
      disliked: [dislikedFoie],
    })

    const { result } = await renderHook(() => useDeletePreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('p-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.liked).toHaveLength(1)
    expect(cached!.liked[0].foodName).toBe('Brocoli')
    expect(cached!.disliked).toHaveLength(1)
  })

  it('removes preference from disliked list in cache', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [likedPoulet],
      disliked: [dislikedFoie],
    })

    const { result } = await renderHook(() => useDeletePreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('p-3')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.disliked).toHaveLength(0)
    expect(cached!.liked).toHaveLength(1)
  })

  it('returns empty preferences when cache is undefined', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()

    const { result } = await renderHook(() => useDeletePreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('p-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached).toEqual({ liked: [], disliked: [] })
  })

  it('passes into error state on failure', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeletePreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate('p-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
