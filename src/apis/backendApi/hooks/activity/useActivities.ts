import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StravaActivitiesResponseDTO } from '@/src/apis/backendApi/dto/activity/activity.dto'
import { stravaActivityDTOtoStravaActivity } from '@/src/apis/backendApi/mappers/activity/activity.mapper'
import type { StravaActivity } from '@/src/models/activity/strava-activity.model'

async function fetchActivities(): Promise<StravaActivity[]> {
  const { data } = await backendClient.get<StravaActivitiesResponseDTO>('/api/activities', {
    params: { limit: 30 },
  })
  return data.data.map(stravaActivityDTOtoStravaActivity)
}

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
