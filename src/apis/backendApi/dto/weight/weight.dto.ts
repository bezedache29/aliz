export interface WeightEntryDTO {
  id: string
  weight: number | null
  bmi: number | null
  bodyfat: number | null
  water: number | null
  muscle: number | null
  bone: number | null
  bmr: number | null
  protein: number | null
  bodyAge: number | null
  heartRate: number | null
  measuredAt: string
  createdAt: string
  updatedAt: string
}

export interface WeightHistoryResponseDTO {
  data: WeightEntryDTO[]
}

export interface WeightSyncResponseDTO {
  newEntry: boolean
  weight: number | null
  lastSyncedAt: string | null
}
