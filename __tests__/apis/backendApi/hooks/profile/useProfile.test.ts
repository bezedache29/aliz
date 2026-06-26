import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import type { ProfileDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import type { Profile } from '@/src/models/profile/profile.model'

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

const profileDTO: ProfileDTO = {
  id: 'p-1',
  firstName: 'Christophe',
  age: 43,
  gender: 'male',
  heightCm: 178,
  currentWeightKg: 85.5,
  targetWeightKg: 75,
  activityLevel: 'moderate',
  weightLossRateKg: 0.5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useProfile', () => {
  it('retourne le profil mappé en cas de succès', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: profileDTO } })
    const { result } = await renderHook(() => useProfile(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const expected: Profile = {
      id: 'p-1',
      firstName: 'Christophe',
      age: 43,
      gender: 'male',
      heightCm: 178,
      currentWeightKg: 85.5,
      targetWeightKg: 75,
      activityLevel: 'moderate',
      weightLossRateKg: 0.5,
    }
    expect(result.current.data).toEqual(expected)
  })

  it('retourne null en cas de 404', async () => {
    mockedGet.mockRejectedValueOnce({ response: { status: 404 } })
    const { result } = await renderHook(() => useProfile(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('passe en état error pour les erreurs non-404', async () => {
    mockedGet.mockRejectedValue({ response: { status: 500 } })
    const { result } = await renderHook(() => useProfile(), { wrapper: makeWrapper() })
    await act(async () => {
      await jest.runAllTimersAsync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    mockedGet.mockReset()
  })
})
