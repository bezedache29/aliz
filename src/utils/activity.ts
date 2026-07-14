import type Ionicons from '@expo/vector-icons/Ionicons'

import type { ColorTokens } from '@/src/styles/design-tokens'

type IconName = React.ComponentProps<typeof Ionicons>['name']
type ActivityColorKey = 'primary' | 'info' | 'tertiary' | 'warning'

interface ActivityTypeInfo {
  label: string
  icon: IconName
  colorKey: ActivityColorKey
}

const ACTIVITY_TYPE_INFO: Record<string, ActivityTypeInfo> = {
  Run: { label: 'Course à pied', icon: 'walk-outline', colorKey: 'primary' },
  TrailRun: { label: 'Trail', icon: 'walk-outline', colorKey: 'primary' },
  VirtualRun: { label: 'Course virtuelle', icon: 'walk-outline', colorKey: 'primary' },
  Walk: { label: 'Marche', icon: 'walk-outline', colorKey: 'primary' },
  Hike: { label: 'Randonnée', icon: 'walk-outline', colorKey: 'primary' },
  Ride: { label: 'Vélo', icon: 'bicycle-outline', colorKey: 'info' },
  GravelRide: { label: 'Gravel', icon: 'bicycle-outline', colorKey: 'info' },
  MountainBikeRide: { label: 'VTT', icon: 'bicycle-outline', colorKey: 'info' },
  EBikeRide: { label: 'Vélo électrique', icon: 'bicycle-outline', colorKey: 'info' },
  VirtualRide: { label: 'Vélo virtuel', icon: 'bicycle-outline', colorKey: 'info' },
  Swim: { label: 'Natation', icon: 'water-outline', colorKey: 'tertiary' },
  WeightTraining: { label: 'Musculation', icon: 'barbell-outline', colorKey: 'warning' },
  Workout: { label: 'Entraînement', icon: 'fitness-outline', colorKey: 'warning' },
  Yoga: { label: 'Yoga', icon: 'body-outline', colorKey: 'tertiary' },
  Rowing: { label: 'Aviron', icon: 'boat-outline', colorKey: 'tertiary' },
  AlpineSki: { label: 'Ski alpin', icon: 'snow-outline', colorKey: 'info' },
  NordicSki: { label: 'Ski de fond', icon: 'snow-outline', colorKey: 'info' },
  BackcountrySki: { label: 'Ski de randonnée', icon: 'snow-outline', colorKey: 'info' },
}

const DEFAULT_ACTIVITY_TYPE_INFO: ActivityTypeInfo = {
  label: '',
  icon: 'fitness-outline',
  colorKey: 'primary',
}

export function getActivityTypeInfo(type: string): ActivityTypeInfo {
  return ACTIVITY_TYPE_INFO[type] ?? { ...DEFAULT_ACTIVITY_TYPE_INFO, label: type }
}

export function getActivityTypeColor(colorKey: ActivityColorKey, c: ColorTokens): string {
  return c[colorKey]
}

export function formatActivityDistance(meters: number | null): string | null {
  if (meters == null) return null
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatActivityDuration(seconds: number | null): string | null {
  if (seconds == null) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes} min`
}

export function formatActivityElevation(meters: number | null): string | null {
  if (meters == null) return null
  return `${Math.round(meters)} m D+`
}

export function formatActivityCalories(kcal: number | null): string | null {
  if (kcal == null) return null
  return `${Math.round(kcal)} kcal`
}
