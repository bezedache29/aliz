import { act, renderHook, waitFor } from '@testing-library/react-native'
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useCreateProfile } from '@/src/apis/backendApi/hooks/profile/useCreateProfile'
import type { ProfileDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import type { OnboardingData } from '@/src/store/onboardingAtom'

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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const onboarding: OnboardingData = {
  completed: true,
  firstName: 'Christophe',
  age: 43,
  sex: 'male',
  height: 178,
  activityLevel: 'moderate',
  stravaConnected: false,
  currentWeight: 85.5,
  targetWeight: 75,
  weeklyLossKg: 0.5,
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

describe('useCreateProfile', () => {
  it('retourne le profil créé en cas de succès', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: profileDTO } })
    const { result } = await renderHook(() => useCreateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync(onboarding)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(profileDTO)
  })

  it("passe en état error en cas d'échec", async () => {
    mockedPost.mockRejectedValueOnce(new Error('Network error'))
    const { result } = await renderHook(() => useCreateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      result.current.mutate(onboarding)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('appelle POST /api/profile', async () => {
    mockedPost.mockResolvedValueOnce({ data: { data: profileDTO } })
    const { result } = await renderHook(() => useCreateProfile(), { wrapper: makeWrapper() })

    await act(async () => {
      await result.current.mutateAsync(onboarding)
    })

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        firstName: 'Christophe',
        age: 43,
        gender: 'male',
        heightCm: 178,
      }),
    )
  })
})
