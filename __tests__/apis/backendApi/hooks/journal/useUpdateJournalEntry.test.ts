import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUpdateJournalEntry } from '@/src/apis/backendApi/hooks/journal/useUpdateJournalEntry'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

import { backendClient } from '@/src/apis/backendApi/client'

jest.mock('@/src/apis/backendApi/client', () => ({
  backendClient: { put: jest.fn() },
}))
const mockedPut = backendClient.put as jest.Mock

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

const updatedMeal: PlannedMeal = {
  id: 'j-1',
  name: 'Pomme',
  meal: 'Collation',
  kcal: 160,
  proteines: 0,
  glucides: 40,
  lipides: 0,
  quantityG: 200,
}

describe('useUpdateJournalEntry', () => {
  it('appelle PUT /api/journal/entries/:id', async () => {
    mockedPut.mockResolvedValueOnce({ data: { data: {} } })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ meal: updatedMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPut).toHaveBeenCalledWith(
      '/api/journal/entries/j-1',
      expect.objectContaining({ quantityG: 200 }),
    )
  })

  it('met à jour le cache de la bonne date avec le repas modifié', async () => {
    mockedPut.mockResolvedValueOnce({ data: { data: {} } })
    const queryClient = makeQueryClient()
    const existing: PlannedMeal = { ...updatedMeal, kcal: 80, quantityG: 100 }
    queryClient.setQueryData<PlannedMeal[]>(['journal', '2026-01-15'], [existing])

    const { result } = await renderHook(() => useUpdateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ meal: updatedMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<PlannedMeal[]>(['journal', '2026-01-15'])
    expect(cached).toHaveLength(1)
    expect(cached![0].quantityG).toBe(200)
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPut.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useUpdateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ meal: updatedMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
