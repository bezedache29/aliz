export interface WeightEntry {
  id: string
  date: string
  weight: number
  bodyFatPercentage?: number
  muscleMass?: number
  source: 'renpho' | 'healthconnect' | 'manual'
}
