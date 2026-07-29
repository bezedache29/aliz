import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useDeleteJournalEntry } from '@/src/apis/backendApi/hooks/journal/useDeleteJournalEntry'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

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

describe('useDeleteJournalEntry', () => {
  it('appelle DELETE /api/journal/entries/:id', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeleteJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: 'j-1', dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDelete).toHaveBeenCalledWith('/api/journal/entries/j-1')
  })

  it('retire le repas supprimé du cache de la bonne date', async () => {
    mockedDelete.mockResolvedValueOnce({})
    const queryClient = makeQueryClient()
    const existing: PlannedMeal = {
      id: 'j-1',
      name: 'Pomme',
      meal: 'Collation',
      kcal: 80,
      proteines: 0,
      glucides: 20,
      lipides: 0,
    }
    queryClient.setQueryData<PlannedMeal[]>(['journal', '2026-01-15'], [existing])

    const { result } = await renderHook(() => useDeleteJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: 'j-1', dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<PlannedMeal[]>(['journal', '2026-01-15'])
    expect(cached).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useDeleteJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ id: 'j-1', dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
