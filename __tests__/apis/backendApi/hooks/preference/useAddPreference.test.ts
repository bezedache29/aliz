import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useAddPreference } from '@/src/apis/backendApi/hooks/preference/useAddPreference'
import type { FoodPreferenceDTO } from '@/src/apis/backendApi/dto/preference/preference.dto'
import type { FoodPreference, FoodPreferences } from '@/src/models/preference/food-preference.model'
import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { post: jest.fn() },
}))
const mockedPost = backendClient.post as jest.Mock

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

const pouletDTO: FoodPreferenceDTO = { id: 'p-1', foodName: 'Poulet', type: 'liked' }
const foieDTO: FoodPreferenceDTO = { id: 'p-2', foodName: 'Foie', type: 'disliked' }

const existingLiked: FoodPreference = { id: 'p-10', foodName: 'Brocoli', type: 'liked' }
const existingDisliked: FoodPreference = { id: 'p-20', foodName: 'Betterave', type: 'disliked' }

describe('useAddPreference', () => {
  it('calls POST /api/preferences with correct body', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: pouletDTO } })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Poulet', type: 'liked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith('/api/preferences', {
      foodName: 'Poulet',
      type: 'liked',
    })
  })

  it('adds preference to liked list in cache on success', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: pouletDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [existingLiked],
      disliked: [existingDisliked],
    })

    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Poulet', type: 'liked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.liked).toHaveLength(2)
    expect(cached!.liked.some((p) => p.foodName === 'Poulet')).toBe(true)
    expect(cached!.disliked).toHaveLength(1)
    expect(cached!.disliked[0].foodName).toBe('Betterave')
  })

  it('adds preference to disliked list in cache on success', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: foieDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [existingLiked],
      disliked: [],
    })

    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Foie', type: 'disliked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.disliked).toHaveLength(1)
    expect(cached!.disliked[0].foodName).toBe('Foie')
    expect(cached!.liked).toHaveLength(1)
  })

  it('removes from disliked list when moved to liked', async () => {
    // Poulet était dans disliked, on le passe en liked — le backend gère le swap,
    // et l'app doit mettre à jour le cache en retirant de disliked
    const movedDTO: FoodPreferenceDTO = { id: 'p-99', foodName: 'Poulet', type: 'liked' }
    mockedPost.mockResolvedValueOnce({ data: { data: movedDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [],
      disliked: [{ id: 'p-old', foodName: 'Poulet', type: 'disliked' }],
    })

    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Poulet', type: 'liked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.liked).toHaveLength(1)
    expect(cached!.liked[0].foodName).toBe('Poulet')
    expect(cached!.disliked).toHaveLength(0)
  })

  it('removes from liked list when moved to disliked', async () => {
    const movedDTO: FoodPreferenceDTO = { id: 'p-99', foodName: 'Poulet', type: 'disliked' }
    mockedPost.mockResolvedValueOnce({ data: { data: movedDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<FoodPreferences>(['preferences'], {
      liked: [{ id: 'p-old', foodName: 'Poulet', type: 'liked' }],
      disliked: [],
    })

    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Poulet', type: 'disliked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.disliked).toHaveLength(1)
    expect(cached!.disliked[0].foodName).toBe('Poulet')
    expect(cached!.liked).toHaveLength(0)
  })

  it('initializes cache when undefined', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: pouletDTO } })
    const queryClient = makeQueryClient()

    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ foodName: 'Poulet', type: 'liked' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<FoodPreferences>(['preferences'])
    expect(cached!.liked).toHaveLength(1)
    expect(cached!.disliked).toHaveLength(0)
  })

  it('passes into error state on failure', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useAddPreference(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ foodName: 'Poulet', type: 'liked' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
