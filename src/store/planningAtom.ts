import dayjs from '@/src/config/dayjs'
import { PlannedMeal } from '@/src/models/planning/planning.model'
import { Dayjs } from 'dayjs'
import { atom } from 'jotai'

import { atomWithMMKV } from './atomWithMMKV'

export const selectedDateAtom = atom<Dayjs>(dayjs())

// Record<YYYY-MM-DD, PlannedMeal[]>
export const weekPlanAtom = atomWithMMKV<Record<string, PlannedMeal[]>>('week_plan', {})
