import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useUpdateProfile } from '@/src/apis/backendApi/hooks/profile/useUpdateProfile'
import type { ProfileDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'

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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const profileDTO: ProfileDTO = {
  id: 'p-1',
  firstName: 'Chris',
  age: 43,
  gender: 'male',
  heightCm: 178,
  currentWeightKg: 83,
  targetWeightKg: 75,
  activityLevel: 'active',
  weightLossRateKg: 0.5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

describe('useUpdateProfile', () => {
  it('retourne le profil mis à jour en cas de succès', async () => {
    mockedPut.mockResolvedValueOnce({ data: { data: profileDTO } })
    const { result } = await renderHook(() => useUpdateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ firstName: 'Chris', activityLevel: 'active' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(profileDTO)
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPut.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useUpdateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      result.current.mutate({ firstName: 'Chris' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('appelle PUT /api/profile avec les champs mappés', async () => {
    mockedPut.mockResolvedValueOnce({ data: { data: profileDTO } })
    const { result } = await renderHook(() => useUpdateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ firstName: 'Chris', height: 178 })
    })

    expect(mockedPut).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        firstName: 'Chris',
        heightCm: 178,
      }),
    )
  })
})
