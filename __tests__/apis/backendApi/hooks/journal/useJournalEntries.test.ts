import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useJournalEntries } from '@/src/apis/backendApi/hooks/journal/useJournalEntries'
import type {
  JournalEntriesResponseDTO,
  JournalEntryDTO,
} from '@/src/apis/backendApi/dto/journal/journal.dto'

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

const entryDTO: JournalEntryDTO = {
  id: 'j-1',
  date: '2026-01-15',
  mealType: 'Petit-déjeuner',
  name: 'Porridge',
  kcal: 380,
  proteines: 12,
  glucides: 58,
  lipides: 10,
  source: 'manual',
  createdAt: '2026-01-15T08:00:00Z',
  updatedAt: '2026-01-15T08:00:00Z',
}

const responseDTO: JournalEntriesResponseDTO = { data: [entryDTO] }

describe('useJournalEntries', () => {
  it('appelle GET /api/journal/entries avec la date en paramètre', async () => {
    mockedGet.mockResolvedValueOnce({ data: responseDTO })
    const { result } = await renderHook(() => useJournalEntries('2026-01-15'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledWith('/api/journal/entries', {
      params: { date: '2026-01-15' },
    })
  })

  it('retourne les repas mappés en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({ data: responseDTO })
    const { result } = await renderHook(() => useJournalEntries('2026-01-15'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Porridge')
  })

  it('retourne une liste vide si aucune entrée pour ce jour', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = await renderHook(() => useJournalEntries('2026-01-15'), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it("passe en état error en cas d'échec", async () => {
    mockedGet.mockRejectedValue(new Error('Network error'))
    const { result } = await renderHook(() => useJournalEntries('2026-01-15'), {
      wrapper: makeWrapper(),
    })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
