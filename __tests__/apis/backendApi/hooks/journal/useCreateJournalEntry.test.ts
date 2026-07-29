import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateJournalEntry } from '@/src/apis/backendApi/hooks/journal/useCreateJournalEntry'
import type { JournalEntryDTO } from '@/src/apis/backendApi/dto/journal/journal.dto'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

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

const newMeal: Omit<PlannedMeal, 'id'> = {
  name: 'Pomme',
  meal: 'Collation',
  kcal: 80,
  proteines: 0,
  glucides: 20,
  lipides: 0,
}

const createdDTO: JournalEntryDTO = {
  id: 'j-99',
  date: '2026-01-15',
  mealType: 'Collation',
  name: 'Pomme',
  kcal: 80,
  proteines: 0,
  glucides: 20,
  lipides: 0,
  source: 'manual',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
}

describe('useCreateJournalEntry', () => {
  it("appelle POST /api/journal/entries et retourne l'entrée créée", async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ meal: newMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/journal/entries',
      expect.objectContaining({ date: '2026-01-15', name: 'Pomme' }),
    )
    expect(result.current.data?.id).toBe('j-99')
  })

  it('ajoute la nouvelle entrée au cache de la bonne date', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: createdDTO } })
    const queryClient = makeQueryClient()
    queryClient.setQueryData<PlannedMeal[]>(['journal', '2026-01-15'], [])

    const { result } = await renderHook(() => useCreateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ meal: newMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const cached = queryClient.getQueryData<PlannedMeal[]>(['journal', '2026-01-15'])
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('j-99')
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const queryClient = makeQueryClient()
    const { result } = await renderHook(() => useCreateJournalEntry(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ meal: newMeal, dateKey: '2026-01-15' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
