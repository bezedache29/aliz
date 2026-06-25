import dayjs from '@/src/config/dayjs'
import { PlannedMeal } from '@/src/models/planning/planning.model'
import { Dayjs } from 'dayjs'
import { atom } from 'jotai'

import { atomWithMMKV } from './atomWithMMKV'

export const selectedDateAtom = atom<Dayjs>(dayjs())

// TODO(backend): remplacer par useQuery/useMutation vers GET|POST /journal/entries
// Lire : GET /journal/entries?date=YYYY-MM-DD → PlannedMeal[]
// Écrire : POST /journal/entries { date, meal } → PlannedMeal
// Supprimer : DELETE /journal/entries/:id
export const weekPlanAtom = atomWithMMKV<Record<string, PlannedMeal[]>>('journal_plan', {})
