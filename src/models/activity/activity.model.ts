import { Dayjs } from 'dayjs'

export interface DailyActivity {
  date: Dayjs
  workouts: {
    type: 'cycling' | 'walking' | 'running' | 'other'
    duration: number
    caloriesBurned: number
    distance?: number
    avgHeartRate?: number
  }[]
  totalCaloriesBurned: number
  kcalPalier: number
  deficit: number
}
