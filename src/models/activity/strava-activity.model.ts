export interface StravaActivity {
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
