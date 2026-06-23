import { atomWithMMKV } from './atomWithMMKV'
import { type ActivityLevel } from '@/src/models/user/user.model'

export interface OnboardingData {
  completed: boolean
  firstName: string
  age: number | null
  sex: 'male' | 'female' | null
  height: number | null
  activityLevel: ActivityLevel | null
  stravaConnected: boolean
  currentWeight: number | null
  targetWeight: number | null
  weeklyLossKg: 0.5 | 1 | null
}

const initial: OnboardingData = {
  completed: false,
  firstName: '',
  age: null,
  sex: null,
  height: null,
  activityLevel: null,
  stravaConnected: false,
  currentWeight: null,
  targetWeight: null,
  weeklyLossKg: null,
}

export const onboardingAtom = atomWithMMKV<OnboardingData>('onboarding_v1', initial)
