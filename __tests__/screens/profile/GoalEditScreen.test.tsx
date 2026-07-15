import { act, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import { useUpdateProfile } from '@/src/apis/backendApi/hooks/profile/useUpdateProfile'
import GoalEditScreen from '@/src/screens/profile/GoalEditScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import type { Profile } from '@/src/models/profile/profile.model'

jest.mock('@/src/apis/backendApi/hooks/profile/useProfile')
const mockedUseProfile = useProfile as jest.Mock

jest.mock('@/src/apis/backendApi/hooks/profile/useUpdateProfile')
const mockedUseUpdateProfile = useUpdateProfile as jest.Mock

const mockedBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockedBack, push: jest.fn() }),
}))

jest.mock('@/src/hooks/use-colors', () => ({
  useColors: () => require('@/src/styles/design-tokens').colors.light,
}))

const mockProfile: Profile = {
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

async function renderScreen(store = createStore()) {
  const result = await render(
    <Provider store={store}>{React.createElement(GoalEditScreen)}</Provider>,
  )
  return { store, ...result }
}

describe('GoalEditScreen', () => {
  afterEach(() => jest.clearAllMocks())

  it('pré-remplit le poids cible depuis le profil', async () => {
    mockedUseProfile.mockReturnValue({ data: mockProfile })
    mockedUseUpdateProfile.mockReturnValue({ mutate: jest.fn(), isPending: false })

    const { getByDisplayValue } = await renderScreen()
    expect(getByDisplayValue('75')).toBeTruthy()
  })

  it("met à jour le profil et synchronise l'atome onboarding au succès", async () => {
    const mutate = jest.fn((_payload, opts) => opts?.onSuccess?.())
    mockedUseProfile.mockReturnValue({ data: mockProfile })
    mockedUseUpdateProfile.mockReturnValue({ mutate, isPending: false })

    const { getByDisplayValue, getByLabelText, store } = await renderScreen()

    await act(async () => {
      fireEvent.changeText(getByDisplayValue('75'), '72')
    })
    await act(async () => {
      fireEvent.press(getByLabelText('Enregistrer'))
    })

    expect(mutate).toHaveBeenCalledWith(
      { targetWeightKg: 72, weightLossRateKg: 0.5 },
      expect.any(Object),
    )
    expect(store.get(onboardingAtom).targetWeight).toBe(72)
    expect(store.get(onboardingAtom).weeklyLossKg).toBe(0.5)
    expect(mockedBack).toHaveBeenCalled()
  })

  it('change le rythme de perte sélectionné avant soumission', async () => {
    const mutate = jest.fn((_payload, opts) => opts?.onSuccess?.())
    mockedUseProfile.mockReturnValue({ data: mockProfile })
    mockedUseUpdateProfile.mockReturnValue({ mutate, isPending: false })

    const { getByText, getByLabelText } = await renderScreen()

    await act(async () => {
      fireEvent.press(getByText('1 kg / semaine'))
    })
    await act(async () => {
      fireEvent.press(getByLabelText('Enregistrer'))
    })

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ weightLossRateKg: 1 }),
      expect.any(Object),
    )
  })

  it('affiche une erreur serveur mappée sur le champ poids cible', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { errors: { targetWeightKg: ['Le poids cible est invalide.'] } } },
    }
    const mutate = jest.fn((_payload, opts) => opts?.onError?.(axiosError))
    mockedUseProfile.mockReturnValue({ data: mockProfile })
    mockedUseUpdateProfile.mockReturnValue({ mutate, isPending: false })

    const { getByLabelText, findByText } = await renderScreen()

    await act(async () => {
      fireEvent.press(getByLabelText('Enregistrer'))
    })

    expect(await findByText('Le poids cible est invalide.')).toBeTruthy()
    expect(mockedBack).not.toHaveBeenCalled()
  })
})
