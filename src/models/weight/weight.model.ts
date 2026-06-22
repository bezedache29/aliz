import { Dayjs } from 'dayjs'

export interface WeightEntry {
  date: Dayjs
  weight: number
  bodyFatPercentage?: number
  muscleMass?: number
  source: 'renpho' | 'healthconnect' | 'manual'
}
