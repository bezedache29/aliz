import type { StravaActivityDTO } from '@/src/apis/backendApi/dto/activity/activity.dto'
import type { StravaActivity } from '@/src/models/activity/strava-activity.model'

export function stravaActivityDTOtoStravaActivity(dto: StravaActivityDTO): StravaActivity {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    startedAt: dto.startedAt,
    distance: dto.distance,
    movingTime: dto.movingTime,
    elapsedTime: dto.elapsedTime,
    totalElevationGain: dto.totalElevationGain,
    calories: dto.calories,
  }
}
