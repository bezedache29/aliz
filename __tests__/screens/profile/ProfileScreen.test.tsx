import { render } from '@testing-library/react-native'
import React from 'react'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import type { Profile } from '@/src/models/profile/profile.model'

import ProfileScreen from '@/src/screens/profile/ProfileScreen'

jest.mock('@/src/apis/backendApi/hooks/profile/useProfile')
const mockedUseProfile = useProfile as jest.Mock

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))

jest.mock('@/src/hooks/use-colors', () => ({
  useColors: () => require('@/src/styles/design-tokens').colors.light,
}))

jest.mock('@/src/hooks/use-refresh', () => ({
  useRefresh: () => ({ refreshing: false, refresh: jest.fn() }),
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

describe('ProfileScreen', () => {
  afterEach(() => jest.clearAllMocks())

  it("n'affiche pas le contenu ni l'état vide pendant le chargement", async () => {
    mockedUseProfile.mockReturnValue({ data: undefined, isLoading: true, refetch: jest.fn() })
    const { queryByText } = await render(<ProfileScreen />)
    expect(queryByText('Christophe')).toBeNull()
    expect(queryByText('Aucun profil trouvé')).toBeNull()
  })

  it("affiche l'état vide quand le profil est null", async () => {
    mockedUseProfile.mockReturnValue({ data: null, isLoading: false, refetch: jest.fn() })
    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('Aucun profil trouvé')).toBeTruthy()
  })

  it('affiche le prénom et les informations de base', async () => {
    mockedUseProfile.mockReturnValue({ data: mockProfile, isLoading: false, refetch: jest.fn() })
    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('Christophe')).toBeTruthy()
    expect(getByText('Homme · 43 ans')).toBeTruthy()
  })

  it('affiche les mesures', async () => {
    mockedUseProfile.mockReturnValue({ data: mockProfile, isLoading: false, refetch: jest.fn() })
    const { getAllByText, getByText } = await render(<ProfileScreen />)
    // Poids cible et perte hebdomadaire
    expect(getByText('75 kg')).toBeTruthy()
    expect(getByText('0.5 kg')).toBeTruthy()
  })

  it('affiche gender female correctement', async () => {
    const femaleProfile: Profile = { ...mockProfile, gender: 'female', firstName: 'Marie' }
    mockedUseProfile.mockReturnValue({ data: femaleProfile, isLoading: false, refetch: jest.fn() })
    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('Femme · 43 ans')).toBeTruthy()
  })

  it("affiche le message 'Objectif atteint' quand le poids cible est atteint", async () => {
    const goalReached: Profile = { ...mockProfile, currentWeightKg: 75, targetWeightKg: 75 }
    mockedUseProfile.mockReturnValue({ data: goalReached, isLoading: false, refetch: jest.fn() })
    const { getByText } = await render(<ProfileScreen />)
    expect(getByText('Objectif atteint !')).toBeTruthy()
  })

  it("affiche le poids restant à perdre quand l'objectif n'est pas atteint", async () => {
    mockedUseProfile.mockReturnValue({ data: mockProfile, isLoading: false, refetch: jest.fn() })
    const { getByText } = await render(<ProfileScreen />)
    // 85.5 - 75 = 10.5 kg restants
    expect(getByText('10.5 kg')).toBeTruthy()
  })
})
