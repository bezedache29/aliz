import { atomWithMMKV } from './atomWithMMKV'
import { type WeightEntry } from '@/src/models/weight/weight.model'

export const weightHistoryAtom = atomWithMMKV<WeightEntry[]>('weight_history_v1', [])
