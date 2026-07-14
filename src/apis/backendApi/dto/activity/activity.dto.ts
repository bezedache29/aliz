export interface StravaActivityDTO {
  id: string
  name: string
  type: string
  startedAt: string
  distance: number | null
  movingTime: number | null
  elapsedTime: number | null
  totalElevationGain: number | null
  calories: number | null
}

export interface StravaActivitiesResponseDTO {
  data: StravaActivityDTO[]
}

export interface StravaActivitySyncResponseDTO {
  newEntries: number
  latestActivity: StravaActivityDTO | null
}
