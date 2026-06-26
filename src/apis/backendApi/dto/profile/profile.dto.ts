export interface ProfileDTO {
  id: string
  firstName: string
  age: number
  gender: 'male' | 'female'
  heightCm: number
  currentWeightKg: number
  targetWeightKg: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  weightLossRateKg: 0.25 | 0.5 | 0.75 | 1.0
  createdAt: string
  updatedAt: string
}

export interface ProfileResponseDTO {
  data: ProfileDTO
}

export interface CreateProfileDTO {
  firstName: string
  age: number
  gender: 'male' | 'female'
  heightCm: number
  currentWeightKg: number
  targetWeightKg: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  weightLossRateKg: number
}

export type UpdateProfileDTO = Partial<CreateProfileDTO>
