import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { StravaStatusDTO } from '@/src/apis/backendApi/dto/strava/strava.dto'

async function fetchStravaStatus(): Promise<StravaStatusDTO> {
  const { data } = await backendClient.get<StravaStatusDTO>('/api/strava/status')
  return data
}

export function useStravaStatus() {
  return useQuery({
    queryKey: ['strava-status'],
    queryFn: fetchStravaStatus,
    staleTime: 60 * 1000,
    retry: 1,
  })
}
