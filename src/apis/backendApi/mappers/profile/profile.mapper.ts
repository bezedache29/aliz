import type {
  CreateProfileDTO,
  ProfileDTO,
  UpdateProfileDTO,
} from '@/src/apis/backendApi/dto/profile/profile.dto'
import type { ActivityLevel } from '@/src/models/user/user.model'
import type { OnboardingData } from '@/src/store/onboardingAtom'

export function profileDTOtoOnboardingData(
  dto: ProfileDTO,
): Pick<
  OnboardingData,
  | 'firstName'
  | 'age'
  | 'sex'
  | 'height'
  | 'activityLevel'
  | 'currentWeight'
  | 'targetWeight'
  | 'weeklyLossKg'
> {
  return {
    firstName: dto.firstName,
    age: dto.age,
    sex: dto.gender,
    height: dto.heightCm,
    activityLevel: dto.activityLevel as ActivityLevel,
    currentWeight: dto.currentWeightKg,
    targetWeight: dto.targetWeightKg,
    weeklyLossKg:
      dto.weightLossRateKg === 0.25 || dto.weightLossRateKg === 0.75
        ? 0.5
        : (dto.weightLossRateKg as 0.5 | 1),
  }
}

export function onboardingDataToCreateDTO(data: OnboardingData): CreateProfileDTO {
  return {
    firstName: data.firstName,
    age: data.age!,
    gender: data.sex!,
    heightCm: data.height!,
    currentWeightKg: data.currentWeight!,
    targetWeightKg: data.targetWeight!,
    activityLevel: data.activityLevel!,
    weightLossRateKg: data.weeklyLossKg!,
  }
}

export function onboardingDataToUpdateDTO(data: Partial<OnboardingData>): UpdateProfileDTO {
  const dto: UpdateProfileDTO = {}
  if (data.firstName !== undefined) dto.firstName = data.firstName
  if (data.age !== undefined) dto.age = data.age ?? undefined
  if (data.sex !== undefined) dto.gender = data.sex ?? undefined
  if (data.height !== undefined) dto.heightCm = data.height ?? undefined
  if (data.currentWeight !== undefined) dto.currentWeightKg = data.currentWeight ?? undefined
  if (data.targetWeight !== undefined) dto.targetWeightKg = data.targetWeight ?? undefined
  if (data.activityLevel !== undefined) dto.activityLevel = data.activityLevel ?? undefined
  if (data.weeklyLossKg !== undefined) dto.weightLossRateKg = data.weeklyLossKg ?? undefined
  return dto
}
