import type { ProfileDTO } from '@/src/apis/backendApi/dto/profile/profile.dto'
import {
  onboardingDataToCreateDTO,
  onboardingDataToUpdateDTO,
  profileDTOtoProfile,
  profileToOnboardingData,
} from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import type { OnboardingData } from '@/src/store/onboardingAtom'

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

const onboardingData: OnboardingData = {
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

describe('profileDTOtoProfile', () => {
  it('mappe tous les champs correctement', () => {
    const result = profileDTOtoProfile(profileDTO)
    expect(result.id).toBe('p-1')
    expect(result.firstName).toBe('Christophe')
    expect(result.age).toBe(43)
    expect(result.gender).toBe('male')
    expect(result.heightCm).toBe(178)
    expect(result.currentWeightKg).toBe(85.5)
    expect(result.targetWeightKg).toBe(75)
    expect(result.activityLevel).toBe('moderate')
    expect(result.weightLossRateKg).toBe(0.5)
  })

  it('mappe gender female correctement', () => {
    const result = profileDTOtoProfile({ ...profileDTO, gender: 'female' })
    expect(result.gender).toBe('female')
  })
})

describe('profileToOnboardingData', () => {
  const profile = profileDTOtoProfile(profileDTO)

  it('mappe tous les champs principaux correctement', () => {
    const result = profileToOnboardingData(profile)
    expect(result.firstName).toBe('Christophe')
    expect(result.age).toBe(43)
    expect(result.height).toBe(178)
    expect(result.currentWeight).toBe(85.5)
    expect(result.targetWeight).toBe(75)
    expect(result.activityLevel).toBe('moderate')
  })

  it('renomme gender → sex', () => {
    const result = profileToOnboardingData(profile)
    expect(result.sex).toBe('male')
  })

  it('mappe weightLossRateKg 0.5 → 0.5', () => {
    const result = profileToOnboardingData({ ...profile, weightLossRateKg: 0.5 })
    expect(result.weeklyLossKg).toBe(0.5)
  })

  it('mappe weightLossRateKg 1.0 → 1', () => {
    const result = profileToOnboardingData({ ...profile, weightLossRateKg: 1.0 })
    expect(result.weeklyLossKg).toBe(1)
  })

  it('mappe weightLossRateKg 0.25 → 0.5 (fallback)', () => {
    const result = profileToOnboardingData({ ...profile, weightLossRateKg: 0.25 })
    expect(result.weeklyLossKg).toBe(0.5)
  })

  it('mappe weightLossRateKg 0.75 → 0.5 (fallback)', () => {
    const result = profileToOnboardingData({ ...profile, weightLossRateKg: 0.75 })
    expect(result.weeklyLossKg).toBe(0.5)
  })

  it('mappe gender female correctement', () => {
    const result = profileToOnboardingData({ ...profile, gender: 'female' })
    expect(result.sex).toBe('female')
  })
})

describe('onboardingDataToCreateDTO', () => {
  it('mappe tous les champs correctement', () => {
    const dto = onboardingDataToCreateDTO(onboardingData)
    expect(dto.firstName).toBe('Christophe')
    expect(dto.age).toBe(43)
    expect(dto.gender).toBe('male')
    expect(dto.heightCm).toBe(178)
    expect(dto.currentWeightKg).toBe(85.5)
    expect(dto.targetWeightKg).toBe(75)
    expect(dto.activityLevel).toBe('moderate')
    expect(dto.weightLossRateKg).toBe(0.5)
  })

  it('renomme sex → gender', () => {
    const dto = onboardingDataToCreateDTO({ ...onboardingData, sex: 'female' })
    expect(dto.gender).toBe('female')
  })

  it('renomme height → heightCm', () => {
    const dto = onboardingDataToCreateDTO({ ...onboardingData, height: 165 })
    expect(dto.heightCm).toBe(165)
  })

  it('renomme currentWeight → currentWeightKg', () => {
    const dto = onboardingDataToCreateDTO({ ...onboardingData, currentWeight: 70 })
    expect(dto.currentWeightKg).toBe(70)
  })

  it('renomme targetWeight → targetWeightKg', () => {
    const dto = onboardingDataToCreateDTO({ ...onboardingData, targetWeight: 65 })
    expect(dto.targetWeightKg).toBe(65)
  })
})

describe('onboardingDataToUpdateDTO', () => {
  it('retourne un objet vide si aucun champ fourni', () => {
    const dto = onboardingDataToUpdateDTO({})
    expect(dto).toEqual({})
  })

  it('inclut uniquement les champs définis', () => {
    const dto = onboardingDataToUpdateDTO({ firstName: 'Chris', age: 40 })
    expect(dto.firstName).toBe('Chris')
    expect(dto.age).toBe(40)
    expect(dto.gender).toBeUndefined()
    expect(dto.heightCm).toBeUndefined()
  })

  it('renomme sex → gender', () => {
    const dto = onboardingDataToUpdateDTO({ sex: 'female' })
    expect(dto.gender).toBe('female')
    expect((dto as any).sex).toBeUndefined()
  })

  it('renomme height → heightCm', () => {
    const dto = onboardingDataToUpdateDTO({ height: 170 })
    expect(dto.heightCm).toBe(170)
    expect((dto as any).height).toBeUndefined()
  })

  it('renomme currentWeight → currentWeightKg', () => {
    const dto = onboardingDataToUpdateDTO({ currentWeight: 80 })
    expect(dto.currentWeightKg).toBe(80)
  })

  it('renomme targetWeight → targetWeightKg', () => {
    const dto = onboardingDataToUpdateDTO({ targetWeight: 72 })
    expect(dto.targetWeightKg).toBe(72)
  })

  it('renomme weeklyLossKg → weightLossRateKg', () => {
    const dto = onboardingDataToUpdateDTO({ weeklyLossKg: 1 })
    expect(dto.weightLossRateKg).toBe(1)
  })

  it('renomme activityLevel correctement', () => {
    const dto = onboardingDataToUpdateDTO({ activityLevel: 'active' })
    expect(dto.activityLevel).toBe('active')
  })
})
